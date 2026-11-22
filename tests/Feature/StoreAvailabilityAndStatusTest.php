<?php

namespace Tests\Feature;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\PaymentGatewayService;
use App\Services\StoreAvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class StoreAvailabilityAndStatusTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::create([
            'name' => 'Refrigerante Lata',
            'price' => 6.00,
            'category' => 'Bebidas',
            'is_active_delivery' => true,
            'show_on_digital_menu' => true,
        ]);
    }

    private function createOpenRegister(): CashRegister
    {
        $user = User::factory()->create(['role' => 'admin']);

        return CashRegister::create([
            'user_id' => $user->id,
            'opening_balance' => 100.00,
            'status' => 'open',
            'opened_at' => now(),
        ]);
    }

    private function createSetting(bool $isOpen = true, ?array $openingHours = null): StoreSetting
    {
        return StoreSetting::create([
            'store_name' => 'Sr & Sra Lucchese Pizzaria',
            'is_open' => $isOpen,
            'opening_hours' => $openingHours ?? [
                'sunday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                'monday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                'tuesday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                'wednesday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                'thursday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                'friday' => ['open' => '18:00', 'close' => '00:00', 'closed' => false],
                'saturday' => ['open' => '18:00', 'close' => '02:00', 'closed' => false],
            ],
        ]);
    }

    private function onlineOrderPayload(): array
    {
        return [
            'customer_name' => 'Maria Lucchese',
            'customer_phone' => '(51) 99999-8888',
            'type' => 'pickup',
            'payment_method' => 'cash',
            'items' => [
                [
                    'type' => 'product',
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                ],
            ],
        ];
    }

    public function test_online_order_is_blocked_when_cash_register_is_closed(): void
    {
        $this->travelTo(Carbon::parse('2026-11-20 19:00:00', 'America/Sao_Paulo'));
        $this->createSetting(isOpen: true);

        $response = $this->postJson('/api/online-orders', $this->onlineOrderPayload());

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'reason' => 'cash_register_closed',
            ]);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_online_order_is_blocked_when_store_is_manually_closed(): void
    {
        $this->travelTo(Carbon::parse('2026-11-20 19:00:00', 'America/Sao_Paulo'));
        $this->createSetting(isOpen: false);
        $this->createOpenRegister();

        $response = $this->postJson('/api/online-orders', $this->onlineOrderPayload());

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'reason' => 'store_closed',
            ]);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_online_order_is_blocked_outside_opening_hours_even_if_register_is_open(): void
    {
        $this->travelTo(Carbon::parse('2026-11-20 14:30:00', 'America/Sao_Paulo'));
        $this->createSetting(isOpen: true);
        $this->createOpenRegister();

        $response = $this->postJson('/api/online-orders', $this->onlineOrderPayload());

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'reason' => 'outside_hours',
            ]);

        $this->getJson('/api/digital-menu')
            ->assertOk()
            ->assertJsonPath('store_availability.is_accepting_orders', false)
            ->assertJsonPath('store_availability.reason', 'outside_hours');
    }

    public function test_online_order_succeeds_during_opening_hours_and_overnight_window_and_links_register(): void
    {
        $this->createSetting(isOpen: true);
        $register = $this->createOpenRegister();

        // Friday 19:30 -> inside 18:00 - 00:00
        $this->travelTo(Carbon::parse('2026-11-20 19:30:00', 'America/Sao_Paulo'));

        $response = $this->postJson('/api/online-orders', $this->onlineOrderPayload());

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        $orderId = $response->json('order_id');
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'cash_register_id' => $register->id,
        ]);

        // Sunday 01:15 -> inside Saturday's overnight window (18:00 - 02:00)
        $availability = app(StoreAvailabilityService::class)->evaluate(
            now: Carbon::parse('2026-11-22 01:15:00', 'America/Sao_Paulo')
        );
        $this->assertTrue($availability['is_accepting_orders']);
        $this->assertNull($availability['reason']);
    }

    public function test_payment_status_allows_owner_by_phone_cookie_and_staff_and_blocks_strangers(): void
    {
        $order = new Order;
        $order->forceFill([
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'type' => 'pickup',
            'customer_name' => 'Cliente Teste',
            'customer_phone' => '(51) 99999-8888',
            'total_amount' => 75.00,
        ])->save();

        // Stranger without session or matching phone cookie gets 403
        $this->getJson("/api/orders/{$order->id}/payment-status")
            ->assertStatus(403);

        // Customer returning from another session with only raw phone cookie gets 403 (prevents phone-based IDOR impersonation)
        $this->withCredentials()
            ->withCookie('customer_phone', '51999998888')
            ->getJson("/api/orders/{$order->id}/payment-status")
            ->assertStatus(403);

        // Customer with verified session ownership (owned_order_ids) succeeds
        $this->withSession(['owned_order_ids' => [$order->id]])
            ->getJson("/api/orders/{$order->id}/payment-status")
            ->assertOk()
            ->assertJson([
                'success' => true,
                'order_id' => $order->id,
                'status' => Order::STATUS_AWAITING_PAYMENT,
            ]);

        // Authenticated staff member succeeds
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)
            ->getJson("/api/orders/{$order->id}/payment-status")
            ->assertOk()
            ->assertJson([
                'success' => true,
                'order_id' => $order->id,
            ]);
    }
}
