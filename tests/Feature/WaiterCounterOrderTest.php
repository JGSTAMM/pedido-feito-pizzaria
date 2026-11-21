<?php

namespace Tests\Feature;

use App\Models\CashRegister;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WaiterCounterOrderTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        StoreSetting::create([
            'store_name' => 'Sr. & Sra. Lucchese Pizzaria',
            'is_open' => true,
        ]);

        $this->product = Product::factory()->create([
            'name' => 'Batata Frita Grande',
            'price' => 14.00,
            'category' => 'Porções',
            'is_active_pos' => true,
        ]);
    }

    public function test_waiter_and_admin_can_access_waiter_counter_and_customer_search(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);
        $admin = User::factory()->create(['role' => 'admin']);
        Customer::create(['name' => 'Maria Oliveira', 'phone' => '51999990000']);

        $this->actingAs($waiter)
            ->get('/waiter/counter')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Waiter/Counter'));

        $this->actingAs($admin)
            ->get('/waiter/counter')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Waiter/Counter'));

        $this->actingAs($waiter)
            ->getJson('/api/customers/search?query=Maria')
            ->assertOk()
            ->assertJsonPath('found', true)
            ->assertJsonPath('customers.0.name', 'Maria Oliveira');
    }

    public function test_waiter_can_create_paid_counter_order_with_split_payment(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);
        $register = CashRegister::create([
            'user_id' => $waiter->id,
            'opening_balance' => 50.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $response = $this->actingAs($waiter)->post('/waiter/counter/order', [
            'customer_name' => 'João Balcão',
            'customer_phone' => '51988887777',
            'pay_now' => true,
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 20.00],
                ['method' => 'pix', 'amount' => 10.00],
            ],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 2,
                    'price' => 14.00,
                ],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->type);
        $this->assertEquals($register->id, $order->cash_register_id);
        $this->assertEquals(28.00, (float) $order->total_amount);
        $this->assertEquals(2.00, (float) $order->change_amount);
        $this->assertNotNull($order->paid_at);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 2000,
        ]);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'pix',
            'amount' => 1000,
        ]);
        $this->assertDatabaseHas('print_jobs', [
            'order_id' => $order->id,
            'type' => 'kitchen',
        ]);
    }

    public function test_waiter_can_send_unpaid_counter_order_to_cashier_and_settle_later(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);
        $cashier = User::factory()->create(['role' => 'cashier']);
        $register = CashRegister::create([
            'user_id' => $cashier->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $createRes = $this->actingAs($waiter)->post('/waiter/counter/order', [
            'customer_name' => 'Cliente Balcão',
            'pay_now' => false,
            'payments' => [],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 1,
                    'price' => 14.00,
                ],
            ],
        ]);

        $createRes->assertRedirect();
        $createRes->assertSessionHas('success');

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->type);
        $this->assertNull($order->paid_at);
        $this->assertEquals(0, $order->payments()->count());
        $this->assertDatabaseHas('print_jobs', [
            'order_id' => $order->id,
            'type' => 'kitchen',
        ]);

        // Unpaid order appears on Waiter Orders list even if marked delivered
        $order->update(['status' => 'delivered']);
        $this->actingAs($waiter)
            ->get('/waiter/orders')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Waiter/Orders')
                ->where('orders.0.id', $order->id)
                ->where('orders.0.is_paid', false)
            );

        // Cashier or Waiter settles the order via POST /orders/{order}/pay
        $payRes = $this->actingAs($cashier)->postJson("/orders/{$order->id}/pay", [
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 20.00],
            ],
        ]);

        $payRes->assertOk()->assertJson(['success' => true]);

        $order->refresh();
        $this->assertNotNull($order->paid_at);
        $this->assertEquals('completed', $order->status);
        $this->assertEquals(6.00, (float) $order->change_amount);
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 2000,
        ]);
    }

    public function test_counter_order_is_rejected_when_cash_register_is_closed(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);

        $response = $this->actingAs($waiter)->post('/waiter/counter/order', [
            'customer_name' => 'Cliente Sem Caixa',
            'pay_now' => true,
            'payments' => [
                ['method' => 'pix', 'amount' => 14.00],
            ],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 1,
                    'price' => 14.00,
                ],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals(0, Order::count());
    }
}
