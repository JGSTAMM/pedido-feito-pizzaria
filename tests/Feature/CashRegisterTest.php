<?php

namespace Tests\Feature;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class CashRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        // Product needed for some POS related logic if any
        Product::factory()->create(['name' => 'Test Product', 'price' => 10, 'category' => 'Test']);

        // Seed StoreSetting for middleware/view composers
        \App\Models\StoreSetting::create([
            'store_name' => 'Pedido Feito',
            'phone' => '123456789',
            'full_address' => 'Test Address',
            'is_open' => true,
        ]);
    }

    public function test_can_open_register()
    {
        $this->actingAs($this->user)
            ->post('/cash-register/open', [
                'opening_balance' => 100.00,
            ])
            ->assertStatus(302);

        $this->assertDatabaseHas('cash_registers', [
            'user_id' => $this->user->id,
            'opening_balance' => 10000,
            'status' => 'open',
        ]);
    }

    public function test_pos_order_links_to_active_register()
    {
        // Open register
        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->actingAs($this->user);

        // Simulate creating an order via POS
        $response = $this->post('/pos/order', [
            'customer_name' => 'Test Customer',
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 50.00]
            ],
            'items' => [
                [
                    'id' => Product::first()->id,
                    'type' => 'product',
                    'quantity' => 5,
                    'price' => 10.00
                ]
            ]
        ]);

        $response->assertStatus(302);
        
        $order = Order::latest()->first();
        $this->assertEquals($register->id, $order->cash_register_id);
    }

    public function test_summary_calculation()
    {
        $this->withoutExceptionHandling();

        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        // Create Order 1: Cash 50, Total 40, Change 10
        $order1 = Order::create([
            'user_id' => $this->user->id,
            'cash_register_id' => $register->id,
            'total_amount' => 40.00,
            'change_amount' => 10.00,
            'status' => 'paid',
            'paid_at' => now(),
            'type' => 'pickup',
            'customer_name' => 'Test',
        ]);
        Payment::create(['order_id' => $order1->id, 'method' => 'dinheiro', 'amount' => 50.00]);

        // Create Order 2: Card 60
        $order2 = Order::create([
            'user_id' => $this->user->id,
            'cash_register_id' => $register->id,
            'total_amount' => 60.00,
            'status' => 'paid',
            'paid_at' => now(),
            'type' => 'pickup',
            'customer_name' => 'Test 2',
        ]);
        Payment::create(['order_id' => $order2->id, 'method' => 'credito', 'amount' => 60.00]);
        
        // Test calculation in controller
        $this->actingAs($this->user)
            ->get('/cash-register')
            ->assertInertia(fn (Assert $page) => $page
                ->component('CashRegister/Index')
                ->where('summary.opening_balance', fn ($val) => (float) $val === 100.0)
                ->where('summary.total_sales', fn ($val) => (float) $val === 100.0)
                ->where('summary.total_change', fn ($val) => (float) $val === 10.0)
                ->where('summary.total_in_drawer', fn ($val) => (float) $val === 140.0)
                ->where('summary.order_count', 2)
            );
    }

    public function test_can_close_register()
    {
        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->actingAs($this->user)
            ->post('/cash-register/close', [
                'closing_balance' => 100.00,
            ])
            ->assertStatus(302);

        $register->refresh();
        $this->assertEquals('closed', $register->status);
        $this->assertEquals(100.00, $register->closing_balance);
    }
}
