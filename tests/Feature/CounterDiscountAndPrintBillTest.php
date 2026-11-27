<?php

namespace Tests\Feature;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CounterDiscountAndPrintBillTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    private User $supervisor;

    private CashRegister $register;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        StoreSetting::create([
            'store_name' => 'Sr. & Sra. Lucchese Pizzaria',
            'is_open' => true,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
        ]);

        $this->supervisor = User::factory()->create([
            'role' => 'supervisor',
            'pin_hash' => Hash::make('4321'),
        ]);

        $this->register = CashRegister::create([
            'user_id' => $this->cashier->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);
    }

    public function test_receive_payment_rejects_discount_without_valid_supervisor_pin(): void
    {
        $order = Order::create([
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'short_code' => 'LOXEE',
            'customer_name' => 'Ana major',
            'total_amount' => 120.00,
            'cash_register_id' => $this->register->id,
            'user_id' => $this->cashier->id,
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson("/orders/{$order->id}/pay", [
                'payments' => [
                    ['method' => 'debito', 'amount' => 100.00],
                ],
                'discount_cents' => 2000,
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);

        $order->refresh();
        $this->assertNull($order->paid_at);
        $this->assertSame(0, (int) $order->discount_amount);
    }

    public function test_receive_payment_applies_discount_with_supervisor_session_pin_and_completes_order(): void
    {
        $order = Order::create([
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'short_code' => 'LOXEE',
            'customer_name' => 'Ana major',
            'total_amount' => 120.00,
            'cash_register_id' => $this->register->id,
            'user_id' => $this->cashier->id,
        ]);

        $this->actingAs($this->cashier)
            ->postJson('/floor/validate-supervisor-pin', ['pin' => '4321'])
            ->assertOk()
            ->assertJsonPath('valid', true);

        $payResponse = $this->actingAs($this->cashier)
            ->postJson("/orders/{$order->id}/pay", [
                'payments' => [
                    ['method' => 'debito', 'amount' => 100.00],
                ],
                'discount_cents' => 2000,
            ]);

        $payResponse->assertOk()
            ->assertJsonPath('success', true);

        $order->refresh();
        $this->assertNotNull($order->paid_at);
        $this->assertSame(Order::STATUS_COMPLETED, $order->status);
        $this->assertSame(2000, (int) $order->discount_amount);
        $this->assertSame($this->supervisor->id, $order->discount_approved_by);
    }

    public function test_print_bill_enqueues_cash_register_print_job_for_order(): void
    {
        $order = Order::create([
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'short_code' => 'LOXEE',
            'customer_name' => 'Ana major',
            'customer_phone' => '51981403252',
            'total_amount' => 120.00,
            'notes' => 'Sem cebola na metade',
            'cash_register_id' => $this->register->id,
            'user_id' => $this->cashier->id,
        ]);

        $size = PizzaSize::create([
            'name' => 'Grande',
            'slices' => 8,
            'max_flavors' => 2,
        ]);

        $flavor1 = PizzaFlavor::create(['name' => 'Marguerita', 'base_price' => 75.00, 'is_active' => true]);
        $flavor2 = PizzaFlavor::create(['name' => 'Calabresa', 'base_price' => 75.00, 'is_active' => true]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'type' => 'pizza_custom',
            'pizza_size_id' => $size->id,
            'quantity' => 1,
            'unit_price' => 75.00,
            'subtotal' => 75.00,
            'description' => 'Pizza Grande',
        ]);
        $item->flavors()->attach($flavor1->id, ['id' => (string) \Illuminate\Support\Str::uuid(), 'fraction' => '1/2']);
        $item->flavors()->attach($flavor2->id, ['id' => (string) \Illuminate\Support\Str::uuid(), 'fraction' => '1/2']);

        $response = $this->actingAs($this->cashier)
            ->postJson("/orders/{$order->id}/print-bill", [
                'discount_cents' => 2000,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $job = PrintJob::where('order_id', $order->id)
            ->where('type', 'bill')
            ->where('target', 'cash_register')
            ->first();

        $this->assertNotNull($job);
        $this->assertTrue((bool) ($job->payload['is_order_bill'] ?? false));
        $this->assertEquals(120.0, (float) $job->payload['subtotal']);
        $this->assertEquals(20.0, (float) $job->payload['discount']);
        $this->assertEquals(100.0, (float) $job->payload['total']);
        $this->assertSame('51981403252', $job->payload['customer_phone']);
    }

    public function test_pos_store_applies_discount_with_supervisor_pin_and_enqueues_receipt_when_requested(): void
    {
        $product = Product::factory()->create([
            'name' => 'Porção de Batata Frita',
            'price' => 15.00,
            'category' => 'Porções',
            'is_active_pos' => true,
        ]);

        $response = $this->actingAs($this->cashier)->post('/pos/order', [
            'customer_name' => 'Cliente Balcao',
            'items' => [
                [
                    'id' => $product->id,
                    'type' => 'product',
                    'quantity' => 2,
                    'price' => 15.00,
                ],
            ],
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 25.00],
            ],
            'discount_cents' => 500,
            'discount_supervisor_pin' => '4321',
            'print_receipt' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(500, (int) $order->discount_amount);
        $this->assertSame($this->supervisor->id, $order->discount_approved_by);

        $this->assertDatabaseHas('print_jobs', [
            'order_id' => $order->id,
            'type' => 'kitchen',
        ]);
        $this->assertDatabaseHas('print_jobs', [
            'order_id' => $order->id,
            'type' => 'bill',
            'target' => 'cash_register',
        ]);
    }

    public function test_orders_index_exposes_flavors_detail_items_summary_and_cleans_redundant_size_description(): void
    {
        $order = Order::create([
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'short_code' => 'LOXEE',
            'customer_name' => 'Ana major',
            'total_amount' => 75.00,
            'cash_register_id' => $this->register->id,
            'user_id' => $this->cashier->id,
        ]);

        $size = PizzaSize::create([
            'name' => 'Grande',
            'slices' => 8,
            'max_flavors' => 2,
        ]);

        $flavor1 = PizzaFlavor::create([
            'name' => 'Marguerita',
            'ingredients' => 'Molho, mussarela, manjericão',
            'base_price' => 75.00,
            'is_active' => true,
        ]);
        $flavor2 = PizzaFlavor::create([
            'name' => 'Calabresa',
            'ingredients' => 'Calabresa fatiada e cebola',
            'base_price' => 75.00,
            'is_active' => true,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'type' => 'pizza_custom',
            'pizza_size_id' => $size->id,
            'quantity' => 1,
            'unit_price' => 75.00,
            'subtotal' => 75.00,
            'description' => 'Pizza Grande',
        ]);
        $item->flavors()->attach($flavor1->id, ['id' => (string) \Illuminate\Support\Str::uuid(), 'fraction' => '1/2']);
        $item->flavors()->attach($flavor2->id, ['id' => (string) \Illuminate\Support\Str::uuid(), 'fraction' => '1/2']);

        $this->actingAs($this->cashier)
            ->get('/orders')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Orders/Index')
                ->has('orders.data', 1)
                ->where('orders.data.0.short_code', 'LOXEE')
                ->where('orders.data.0.items_summary.0', '1x Pizza Grande (Marguerita, Calabresa)')
                ->where('orders.data.0.items.0.description', null)
                ->has('orders.data.0.items.0.flavors_detail', 2)
                ->where('orders.data.0.items.0.flavors_detail.0.fraction', '1/2')
                ->where('orders.data.0.items.0.flavors_detail.0.name', 'Marguerita')
            );
    }
}
