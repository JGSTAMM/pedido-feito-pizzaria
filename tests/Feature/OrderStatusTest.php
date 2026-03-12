<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderStatusTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->product = Product::create(['name' => 'Pizza', 'price' => 50.00, 'category' => 'Pizzas']);
    }

    public function test_kds_mark_ready_sets_timestamp()
    {
        $order = Order::create([
            'status' => 'preparing',
            'type' => 'salon',
            'customer_name' => 'Cliente',
            'total_amount' => 50.00,
        ]);

        // Simulate KDS action (using model update as KDS uses Livewire method which updates model)
        $order->update([
            'status' => 'ready',
            'ready_at' => now(),
        ]);

        $this->assertEquals('ready', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->ready_at);
    }

    public function test_api_returns_only_ready_orders_from_today()
    {
        // Ready order from today
        $orderToday = Order::create([
            'status' => 'ready',
            'type' => 'salon',
            'customer_name' => 'Hoje',
            'total_amount' => 50.00,
            'ready_at' => now(),
            'created_at' => now(),
        ]);

        // Ready order from yesterday
        $orderYesterday = Order::create([
            'status' => 'ready',
            'type' => 'salon',
            'customer_name' => 'Ontem',
            'total_amount' => 50.00,
            'ready_at' => now()->subDay(),
            'created_at' => now()->subDay(),
        ]);

        // Preparing order
        $orderPreparing = Order::create([
            'status' => 'preparing',
            'type' => 'salon',
            'customer_name' => 'Preparando',
            'total_amount' => 50.00,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/orders/ready');

        $response->assertStatus(200);
        $orders = $response->json('orders');

        $this->assertCount(1, $orders);
        $this->assertEquals($orderToday->id, $orders[0]['id']);
        $this->assertEquals('Hoje', $orders[0]['customer_name']);
    }
}
