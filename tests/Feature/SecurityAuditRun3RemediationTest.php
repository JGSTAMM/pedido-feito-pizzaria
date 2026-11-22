<?php

namespace Tests\Feature;

use App\Application\CashRegister\BuildCashRegisterSummaryAction;
use App\Application\Printing\PrintAgentPackageBuilder;
use App\Application\Printing\PrintQueueService;
use App\Events\OrderCreated;
use App\Events\TableBillPrintRequested;
use App\Models\CashRegister;
use App\Models\Customer;
use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Table;
use App\Models\User;
use App\Services\PaymentGatewayService;
use App\Services\PizzaPriceService;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class SecurityAuditRun3RemediationTest extends TestCase
{
    use RefreshDatabase;

    private function openStoreAndRegister(User $user): array
    {
        $days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $hours = [];
        foreach ($days as $d) {
            $hours[$d] = ['open' => '00:00', 'close' => '23:59', 'closed' => false];
        }
        $setting = StoreSetting::first() ?? StoreSetting::forceCreate([
            'id' => 1,
            'store_name' => 'Audit Dummy Pizzeria',
            'cnpj' => '00.000.000/0001-00',
            'is_open' => true,
            'opening_hours' => $hours,
            'mercadopago_access_token' => 'TEST-DUMMY-MP-SECRET-123',
            'google_maps_api_key' => 'TEST-DUMMY-GMAPS-456',
            'ifood_merchant_id' => 'TEST-DUMMY-IFOOD-789',
        ]);
        $setting->update([
            'is_open' => true,
            'opening_hours' => $hours,
            'mercadopago_access_token' => 'TEST-DUMMY-MP-SECRET-123',
            'google_maps_api_key' => 'TEST-DUMMY-GMAPS-456',
            'ifood_merchant_id' => 'TEST-DUMMY-IFOOD-789',
        ]);

        $register = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 100.00,
            'status' => 'open',
        ]);

        return [$setting->fresh(), $register];
    }

    public function test_01_floor_pay_and_close_requires_server_verified_supervisor_pin_for_discounts(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('9876')]);
        $waiter = User::factory()->create(['role' => 'garcom', 'pin_hash' => null]);
        [, $register] = $this->openStoreAndRegister($admin);
        $table = Table::create(['name' => 'Mesa 1', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'cash_register_id' => $register->id,
            'type' => 'dine_in',
            'status' => Order::STATUS_PENDING,
            'total_amount' => 100.00,
        ]);

        // Unverified discount attempt with forged discount_supervisor_id must be rejected
        $resp = $this->actingAs($waiter)->post("/floor/{$table->id}/pay", [
            'payments' => [['method' => 'dinheiro', 'amount' => 0]],
            'service_fee_cents' => 0,
            'discount_cents' => 10000,
            'discount_supervisor_id' => $admin->id,
        ]);

        $resp->assertRedirect();
        $resp->assertSessionHas('error');
        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
        $this->assertNull($order->fresh()->paid_at);

        // Unlocking via /floor/validate-supervisor-pin binds server-side session approval
        $this->actingAs($waiter)->postJson('/floor/validate-supervisor-pin', ['pin' => '9876'])
            ->assertOk()
            ->assertJsonPath('valid', true);

        $resp2 = $this->actingAs($waiter)->post("/floor/{$table->id}/pay", [
            'payments' => [['method' => 'dinheiro', 'amount' => 5000]],
            'service_fee_cents' => 0,
            'discount_cents' => 5000,
            'discount_supervisor_id' => $waiter->id, // Client-sent ID is ignored in favor of server-verified admin
        ]);

        $resp2->assertRedirect()->assertSessionHas('success');
        $order->refresh();
        $this->assertSame('completed', $order->status);
        $this->assertSame($admin->id, $order->discount_approved_by);
    }

    public function test_02_neighborhoods_inline_admin_pin_is_rate_limited(): void
    {
        RateLimiter::clear('admin-pin-verify');
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('4821')]);
        $waiter = User::factory()->create(['role' => 'garcom']);
        Neighborhood::create(['name' => 'Centro', 'city' => 'Torres', 'delivery_fee' => 15.00]);

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($waiter)->postJson('/neighborhoods/bulk-update', [
                'admin_pin' => sprintf('%04d', $i),
                'items' => [],
            ])->assertStatus(403);
        }

        // 6th attempt is blocked with 429 Too Many Requests even if PIN is right
        $this->actingAs($waiter)->postJson('/neighborhoods/bulk-update', [
            'admin_pin' => '4821',
            'items' => [],
        ])->assertStatus(429);
    }

    public function test_03_admin_pin_session_unlock_is_revoked_when_pin_is_cleared_or_rotated(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('9876')]);
        $cashier = User::factory()->create(['role' => 'caixa']);
        $nb = Neighborhood::create(['name' => 'Praia', 'city' => 'Torres', 'delivery_fee' => 18.00]);

        $this->actingAs($cashier)->postJson('/neighborhoods/validate-admin-pin', ['pin' => '9876'])->assertOk();

        // Admin clears PIN
        $admin->pin_hash = null;
        $admin->save();

        // Cashier's session unlock is now rejected with 403
        $this->actingAs($cashier)->post('/neighborhoods/bulk-update', [
            'items' => [['id' => $nb->id, 'delivery_fee' => 0.00]],
        ])->assertStatus(403);
        $this->assertEquals(18.0, (float) $nb->fresh()->delivery_fee);
    }

    public function test_04_pin_delete_blocks_closed_register_and_online_paid_and_preserves_delivery_fee(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('1234')]);
        $waiter = User::factory()->create(['role' => 'garcom']);

        $closedReg = CashRegister::create([
            'user_id' => $admin->id,
            'opened_at' => now()->subHours(5),
            'closed_at' => now()->subHours(1),
            'opening_balance' => 100,
            'closing_balance' => 200,
            'status' => 'closed',
        ]);
        $histOrder = Order::create([
            'user_id' => $admin->id,
            'cash_register_id' => $closedReg->id,
            'type' => 'delivery',
            'status' => Order::STATUS_COMPLETED,
            'total_amount' => 100.00,
            'paid_at' => now()->subHours(2),
        ]);

        // Closed register order cannot be deleted
        $this->actingAs($waiter)->postJson("/orders/{$histOrder->id}/delete-with-pin", [
            'pin' => '1234',
            'reason' => 'audit test',
        ])->assertStatus(422)->assertJsonPath('reason', 'register_closed');

        // Online-paid order cannot be deleted without refund
        [, $openReg] = $this->openStoreAndRegister($admin);
        $onlinePaidOrder = Order::create([
            'user_id' => $admin->id,
            'cash_register_id' => $openReg->id,
            'type' => 'delivery',
            'status' => Order::STATUS_PENDING,
            'online_payment_status' => Order::ONLINE_PAYMENT_APPROVED,
            'payment_gateway_id' => 'mp-paid-123',
            'total_amount' => 90.00,
            'paid_at' => now(),
        ]);

        $this->actingAs($waiter)->postJson("/orders/{$onlinePaidOrder->id}/delete-with-pin", [
            'pin' => '1234',
            'reason' => 'audit test',
        ])->assertStatus(422)->assertJsonPath('reason', 'online_payment_requires_refund');

        // Item delete preserves delivery_fee on unpaid order
        $delivOrder = Order::create([
            'user_id' => $admin->id,
            'cash_register_id' => $openReg->id,
            'type' => 'delivery',
            'status' => Order::STATUS_PENDING,
            'delivery_fee' => 15.00,
            'total_amount' => 65.00,
        ]);
        $i1 = OrderItem::create(['order_id' => $delivOrder->id, 'quantity' => 1, 'unit_price' => 30.00, 'subtotal' => 30.00, 'notes' => 'A']);
        OrderItem::create(['order_id' => $delivOrder->id, 'quantity' => 1, 'unit_price' => 20.00, 'subtotal' => 20.00, 'notes' => 'B']);

        $this->actingAs($waiter)->postJson("/orders/{$delivOrder->id}/items/{$i1->id}/delete-with-pin", [
            'pin' => '1234',
        ])->assertOk();
        $this->assertEquals(35.00, (float) $delivOrder->fresh()->total_amount); // R$ 20 item + R$ 15 delivery_fee!
    }

    public function test_05_cashier_cannot_read_or_overwrite_integration_secrets_or_rotate_print_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $cashier = User::factory()->create(['role' => 'caixa']);
        $this->openStoreAndRegister($admin);
        $this->withoutVite();

        $this->actingAs($cashier)->get('/settings')
            ->assertOk()
            ->assertDontSee('TEST-DUMMY-MP-SECRET-123');

        $this->actingAs($cashier)->post('/settings/integrations', [
            'mercadopago_access_token' => 'APP_USR-HIJACKED-BY-CASHIER',
        ])->assertStatus(403);
        $this->assertSame('TEST-DUMMY-MP-SECRET-123', StoreSetting::first()->mercadopago_access_token);

        $initialToken = app(PrintQueueService::class)->getOrCreateAgentToken();
        $this->actingAs($cashier)->post('/settings/printers/regenerate-token')->assertStatus(403);
        $this->assertSame($initialToken, app(PrintQueueService::class)->getOrCreateAgentToken());
    }

    public function test_06_order_status_idor_blocked_and_broadcast_uses_private_channel_and_identify_masks_pii(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->openStoreAndRegister($admin);
        $this->withoutVite();

        Customer::create(['name' => 'Victim Name', 'phone' => '51999998888']);
        $order = Order::create([
            'type' => 'delivery',
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'customer_name' => 'Victim Name',
            'customer_phone' => '51999998888',
            'delivery_address' => 'Rua Secreta 777',
            'delivery_complement' => 'Apt 402',
            'total_amount' => 88.00,
        ]);

        // Unauthenticated IDOR on /menu/order/{order}/status is blocked with 403
        $this->get("/menu/order/{$order->id}/status")->assertStatus(403);

        // Broadcast events use PrivateChannel('orders')
        $ev1 = new OrderCreated($order->id, 'pending', 'delivery', $order->short_code ?? '12345');
        $this->assertInstanceOf(PrivateChannel::class, $ev1->broadcastOn()[0]);

        $ev2 = new TableBillPrintRequested('tbl-1', 'Mesa 1', ['id' => $order->id]);
        $this->assertInstanceOf(PrivateChannel::class, $ev2->broadcastOn()[0]);

        // Unverified phone lookup without name does not leak customer existence/PII or set cookie and does not unlock payment-status IDOR
        $idRespExisting = $this->postJson('/api/customers/identify', ['phone' => '51999998888']);
        $idRespUnknown = $this->postJson('/api/customers/identify', ['phone' => '51977776666']);
        $idRespExisting->assertOk()->assertExactJson(['success' => true, 'found' => false]);
        $idRespUnknown->assertOk()->assertExactJson(['success' => true, 'found' => false]);
        $this->assertNull($idRespExisting->getCookie('customer_phone'));
        $this->getJson("/api/orders/{$order->id}/payment-status")->assertStatus(403);
    }

    public function test_07_checkout_pricing_custom_neighborhood_quantities_table_injection_and_inactive_items_hardened(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, $register] = $this->openStoreAndRegister($admin);
        $prod = Product::create(['name' => 'Burger', 'category' => 'Lanches', 'price' => 30.00, 'is_active_pos' => true, 'is_active_delivery' => true, 'show_on_digital_menu' => true]);
        $hiddenProd = Product::create(['name' => 'Hidden', 'category' => 'Lanches', 'price' => 10.00, 'is_active_pos' => false, 'is_active_delivery' => false, 'show_on_digital_menu' => false]);
        $size = PizzaSize::create(['name' => 'Grande', 'slices' => 8, 'max_flavors' => 2]);
        $table = Table::create(['name' => 'Mesa 5', 'status' => 'occupied']);
        Order::create([
            'table_id' => $table->id,
            'cash_register_id' => $register->id,
            'type' => 'salon',
            'status' => Order::STATUS_PENDING,
            'total_amount' => 45.00,
        ]);

        // 1. Custom neighborhood charges R$ 15.00 fallback delivery fee
        $r1 = $this->postJson('/api/online-orders', [
            'customer_name' => 'CustomShip',
            'customer_phone' => '51988887777',
            'type' => 'delivery',
            'delivery_address' => 'Rua Teste 1',
            'neighborhood_id' => null,
            'custom_neighborhood' => 'Bairro Longe',
            'payment_method' => 'cash',
            'items' => [['type' => 'product', 'product_id' => $prod->id, 'quantity' => 1]],
        ]);
        $r1->assertStatus(201);
        $o1 = Order::where('customer_name', 'CustomShip')->latest()->first();
        $this->assertEquals(15.0, (float) $o1->delivery_fee);
        $this->assertEquals(45.0, (float) $o1->total_amount);
        $this->assertStringContainsString('Bairro Longe', (string) $o1->delivery_address);

        // 2. HybridPizzaPricingService throws InvalidArgumentException on empty flavors
        $this->expectException(InvalidArgumentException::class);
        app(PizzaPriceService::class)->calculateItemPrice($size->id, []);
    }

    public function test_08_webhook_transitions_and_amount_currency_and_state_guards(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [, $register] = $this->openStoreAndRegister($admin);
        config(['services.mercadopago.webhook_secret' => 'audit-secret']);
        Cache::flush();

        // 1. Webhook idempotency allows pending (req-1) -> approved (req-2) transition
        $order1 = Order::create([
            'type' => 'delivery',
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'total_amount' => 100.00,
            'payment_gateway_id' => 'gw-777001',
        ]);
        $mock = Mockery::mock(PaymentGatewayService::class)->makePartial();
        $mock->shouldReceive('fetchPaymentFromGateway')->with('gw-777001')->andReturn(
            (object) ['id' => 'gw-777001', 'status' => 'pending', 'transaction_amount' => 100.00, 'currency_id' => 'BRL', 'external_reference' => $order1->id.'_1'],
            (object) ['id' => 'gw-777001', 'status' => 'approved', 'transaction_amount' => 100.00, 'currency_id' => 'BRL', 'external_reference' => $order1->id.'_1']
        );
        $this->app->instance(PaymentGatewayService::class, $mock);
        $this->app->forgetInstance(\App\Application\Checkout\ProcessPaymentWebhookAction::class);
        $this->app->forgetInstance(\App\Http\Controllers\Api\OnlinePaymentController::class);

        $ts = time();
        $sig1 = hash_hmac('sha256', "id:gw-777001;request-id:req-1;ts:{$ts};", 'audit-secret');
        $sig2 = hash_hmac('sha256', "id:gw-777001;request-id:req-2;ts:{$ts};", 'audit-secret');

        $this->withHeaders(['x-signature' => "ts={$ts},v1={$sig1}", 'x-request-id' => 'req-1'])
            ->postJson('/api/payments/webhook', ['type' => 'payment', 'data' => ['id' => 'gw-777001']])
            ->assertOk();

        $this->withHeaders(['x-signature' => "ts={$ts},v1={$sig2}", 'x-request-id' => 'req-2'])
            ->postJson('/api/payments/webhook', ['type' => 'payment', 'data' => ['id' => 'gw-777001']])
            ->assertOk()->assertJsonMissing(['duplicate' => true]);
        $this->assertSame(Order::STATUS_PENDING, $order1->fresh()->status);
        $this->assertNotNull($order1->fresh()->paid_at);

        // 2. Underpaid/foreign-currency webhook and stale rejection are rejected/ignored
        $order2 = Order::create([
            'type' => 'delivery',
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'total_amount' => 150.00,
            'payment_gateway_id' => 'underpay-gw',
        ]);
        $order3 = Order::create([
            'type' => 'delivery',
            'status' => Order::STATUS_COMPLETED,
            'total_amount' => 80.00,
            'payment_gateway_id' => 'stale-gw',
            'paid_at' => now(),
        ]);

        $svc = Mockery::mock(PaymentGatewayService::class)->makePartial();
        $svc->shouldReceive('fetchPaymentFromGateway')->with('underpay-gw')->andReturn(
            (object) ['id' => 'underpay-gw', 'status' => 'approved', 'transaction_amount' => 0.01, 'currency_id' => 'USD', 'external_reference' => $order2->id.'_9']
        );
        $svc->shouldReceive('fetchPaymentFromGateway')->with('stale-gw')->andReturn(
            (object) ['id' => 'stale-gw', 'status' => 'cancelled', 'transaction_amount' => 80.00, 'currency_id' => 'BRL', 'external_reference' => $order3->id.'_1']
        );

        $this->assertFalse($svc->handleWebhook(['type' => 'payment', 'data' => ['id' => 'underpay-gw']]));
        $this->assertNull($order2->fresh()->paid_at);

        $this->assertTrue($svc->handleWebhook(['type' => 'payment', 'data' => ['id' => 'stale-gw']]));
        $this->assertSame(Order::STATUS_COMPLETED, $order3->fresh()->status);
    }

    public function test_09_kds_state_machine_register_uniqueness_drawer_change_cap_and_api_close(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('5555')]);
        $cashier = User::factory()->create(['role' => 'caixa']);
        $waiter = User::factory()->create(['role' => 'garcom']);
        [, $regA] = $this->openStoreAndRegister($admin);
        $table = Table::create(['name' => 'Mesa 9', 'status' => 'occupied']);

        // 1. KDS blocks moving awaiting_payment -> preparing
        $unpaidOnline = Order::create([
            'cash_register_id' => $regA->id,
            'type' => 'delivery',
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'payment_gateway_id' => 'mp-88',
            'total_amount' => 60.00,
        ]);
        $this->actingAs($waiter)->post("/kds/{$unpaidOnline->id}/status/preparing")->assertRedirect();
        $this->assertSame(Order::STATUS_AWAITING_PAYMENT, $unpaidOnline->fresh()->status);

        // 2. Waiter cannot settle delivery orders via POST /orders/{order}/pay
        $this->actingAs($waiter)->postJson("/orders/{$unpaidOnline->id}/pay", [
            'payments' => [['method' => 'dinheiro', 'amount' => 60.00]],
        ])->assertStatus(403);

        // 3. Non-cash overpayment cannot deflate physical cash drawer below opening_balance
        $prod = Product::create(['name' => 'Pizza Box', 'category' => 'Lanches', 'price' => 20.00, 'is_active_pos' => true]);
        $this->actingAs($waiter)->post('/waiter/counter/order', [
            'customer_name' => 'NoSkim',
            'pay_now' => true,
            'payments' => [['method' => 'pix', 'amount' => 120.00]],
            'items' => [['id' => $prod->id, 'type' => 'product', 'quantity' => 1, 'price' => 20.00]],
        ])->assertRedirect()->assertSessionHas('success');
        $summary = app(BuildCashRegisterSummaryAction::class)->execute($regA);
        $this->assertEquals(100.0, (float) $summary['total_in_drawer']);

        // 4. Cannot open duplicate cash register while one is already open
        $this->actingAs($cashier)->post('/cash-register/open', ['opening_balance' => 0])
            ->assertRedirect()
            ->assertSessionHasErrors('error');
        $this->assertSame(1, CashRegister::where('status', 'open')->count());

        // 5. API closeTable requires supervisor PIN for cashier and cancels unpaid orders instead of deadlocking
        $tOrder = Order::create([
            'table_id' => $table->id,
            'cash_register_id' => $regA->id,
            'type' => 'dine_in',
            'status' => Order::STATUS_PENDING,
            'total_amount' => 90.00,
        ]);
        Sanctum::actingAs($cashier);
        $this->postJson("/api/tables/{$table->id}/close")->assertStatus(403);
        $this->postJson("/api/tables/{$table->id}/close", ['pin' => '5555'])->assertOk();
        $this->assertSame('cancelled', $tOrder->fresh()->status);
    }

    public function test_10_security_headers_print_agent_ack_guard_and_private_zip_storage(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->openStoreAndRegister($admin);

        // 1. SecurityHeaders does not inject X-Forwarded-Host: 10.attacker.example in production
        $this->app['env'] = 'production';
        $cspResp = $this->withHeaders(['X-Forwarded-Host' => '10.attacker.example', 'X-Forwarded-Proto' => 'https'])->get('/login');
        $this->assertStringNotContainsString('10.attacker.example:5173', (string) $cspResp->headers->get('Content-Security-Policy'));
        $this->app['env'] = 'testing';
        $this->flushHeaders();

        // 2. PrintAgent ack rejects un-claimed pending jobs with 409 Conflict
        $tokenAgent = app(PrintQueueService::class)->getOrCreateAgentToken();
        $pj = PrintJob::create(['type' => 'kitchen', 'target' => 'kitchen', 'status' => 'pending', 'payload' => ['a' => 1], 'attempts' => 0]);
        $this->withHeader('Authorization', 'Bearer '.$tokenAgent)
            ->postJson("/api/print-agent/jobs/{$pj->id}/ack", ['success' => true, 'printer_name' => 'x'])
            ->assertStatus(409);

        // 3. PrintAgent ZIP package is created in private storage, not shared /tmp
        $zipPath = app(PrintAgentPackageBuilder::class)->createZipArchive('https://example.test');
        $this->assertStringContainsString('storage', $zipPath);
        $this->assertStringContainsString('print-agent-packages', $zipPath);
        @unlink($zipPath);
    }

    public function test_11_run4_adversarial_fixes_border_offboarding_occupied_table_pix_ssrf_and_gateway_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('7777')]);
        $targetAdmin = User::factory()->create(['role' => 'admin', 'pin_hash' => Hash::make('8888')]);
        $cashier = User::factory()->create(['role' => 'caixa']);
        [, $register] = $this->openStoreAndRegister($targetAdmin);

        // 1. B-01: Offboarding an admin with cash register history clears pin_hash and sets role=revoked
        $this->actingAs($admin)->delete("/users/{$targetAdmin->id}")->assertRedirect();
        $targetAdmin->refresh();
        $this->assertNull($targetAdmin->pin_hash);
        $this->assertSame('revoked', $targetAdmin->role);

        // 2. B-03: Stuffed-crust border_id query uses is_active_pos (not dropped is_active) and bills correctly
        $size = PizzaSize::create(['name' => 'Grande', 'slices' => 8, 'max_flavors' => 2]);
        $flavor = PizzaFlavor::create(['name' => 'Mussarela', 'base_price' => 60.00, 'is_active_pos' => true, 'is_active_delivery' => true, 'show_on_digital_menu' => true]);
        $border = Product::create(['name' => 'Borda Catupiry', 'category' => 'Extras', 'price' => 15.00, 'is_active_pos' => true, 'is_active_delivery' => true, 'show_on_digital_menu' => true]);
        $this->actingAs($admin)->post('/pos/order', [
            'customer_name' => 'BorderTest',
            'payments' => [['method' => 'dinheiro', 'amount' => 75.00]],
            'items' => [[
                'type' => 'pizza_custom',
                'size_id' => $size->id,
                'flavor_ids' => [$flavor->id],
                'border_id' => $border->id,
                'quantity' => 1,
                'price' => 75.00,
            ]],
        ])->assertRedirect()->assertSessionHas('success');
        $this->assertEquals(75.0, (float) Order::where('customer_name', 'BorderTest')->first()->total_amount);

        // 3. R4-A-01: Occupied table blocks PIX dine_in checkout from unauthenticated stranger
        $table = Table::create(['name' => 'Mesa Ocupada', 'status' => 'occupied']);
        Order::create([
            'table_id' => $table->id,
            'cash_register_id' => $register->id,
            'type' => 'salon',
            'status' => Order::STATUS_PENDING,
            'total_amount' => 50.00,
        ]);
        $prod = Product::create(['name' => 'Suco', 'category' => 'Bebidas', 'price' => 12.00, 'is_active_pos' => true, 'is_active_delivery' => true, 'show_on_digital_menu' => true]);
        $this->withSession(['owned_table_id' => $table->id])->postJson('/api/online-orders', [
            'customer_name' => 'Intruder',
            'customer_phone' => '51999990000',
            'type' => 'dine_in',
            'table_id' => $table->id,
            'table_code' => 'Mesa Ocupada',
            'payment_method' => 'pix',
            'items' => [['type' => 'product', 'product_id' => $prod->id, 'quantity' => 1]],
        ])->assertStatus(422);

        // 4. R4-A-05: /api/customers/identify does not overwrite existing customer.name and returns identical payload for existing vs new
        $existingCustomer = Customer::create(['name' => 'Original CRM Name', 'phone' => '51988881111']);
        $existingResp = $this->postJson('/api/customers/identify', ['phone' => '51988881111', 'name' => 'Defaced Name'])->assertOk();
        $newResp = $this->postJson('/api/customers/identify', ['phone' => '51988882222', 'name' => 'Defaced Name'])->assertOk();
        $this->assertSame('Original CRM Name', $existingCustomer->fresh()->name);
        $this->assertSame(array_keys($existingResp->json()), array_keys($newResp->json()));
        $existingResp->assertJsonMissingPath('created')->assertJsonPath('identified', true);
        $newResp->assertJsonMissingPath('created')->assertJsonPath('identified', true);

        // 5. R4-A-06: PrintService::isAllowedPrinterIp blocks 0.0.0.0/8, 127.0.0.1, 169.254.169.254, public IPs and allows LAN RFC1918
        $this->assertFalse(\App\Services\PrintService::isAllowedPrinterIp('0.0.0.0'));
        $this->assertFalse(\App\Services\PrintService::isAllowedPrinterIp('0.0.0.1'));
        $this->assertFalse(\App\Services\PrintService::isAllowedPrinterIp('127.0.0.1'));
        $this->assertFalse(\App\Services\PrintService::isAllowedPrinterIp('169.254.169.254'));
        $this->assertFalse(\App\Services\PrintService::isAllowedPrinterIp('8.8.8.8'));
        $this->assertTrue(\App\Services\PrintService::isAllowedPrinterIp('192.168.1.50'));

        // Cashier cannot create/modify printers
        $this->actingAs($cashier)->post('/settings/printers', [
            'name' => 'P1',
            'type' => 'production',
            'target' => 'kitchen',
            'ip_address' => '192.168.1.50',
        ])->assertStatus(403);

        // 6. R4-A-03: POS rejects unverified/foreign gateway_id
        $this->actingAs($admin)->post('/pos/order', [
            'customer_name' => 'FakeGwPos',
            'payments' => [['method' => 'pix', 'amount' => 12.00, 'gateway_id' => 'unowned-fake-gw-999']],
            'items' => [['id' => $prod->id, 'type' => 'product', 'quantity' => 1, 'price' => 12.00]],
        ])->assertRedirect()->assertSessionHas('error');
        $this->assertNull(Order::where('customer_name', 'FakeGwPos')->first());

        // 7. B-04: OrderController::receivePayment rejects awaiting_payment orders
        $awaitingOrder = Order::create([
            'type' => 'pickup',
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'total_amount' => 30.00,
        ]);
        $this->actingAs($admin)->postJson("/orders/{$awaitingOrder->id}/pay", [
            'payments' => [['method' => 'dinheiro', 'amount' => 30.00]],
        ])->assertStatus(422);
    }
}
