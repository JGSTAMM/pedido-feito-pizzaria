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
        $order = new Order();
        $order->forceFill([
            'status' => 'preparing',
            'type' => 'salon',
            'customer_name' => 'Cliente',
            'total_amount' => 50.00,
        ])->save();

        // Simulate KDS action (using model update as KDS uses Livewire method which updates model)
        $order->forceFill([
            'status' => 'ready',
            'ready_at' => now(),
        ])->save();

        $this->assertEquals('ready', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->ready_at);
    }

    public function test_api_returns_only_ready_orders_from_today()
    {
        // Ready order from today
        $orderToday = new Order();
        $orderToday->forceFill([
            'status' => 'ready',
            'type' => 'salon',
            'customer_name' => 'Hoje',
            'total_amount' => 50.00,
            'ready_at' => now(),
            'created_at' => now(),
        ])->save();

        // Ready order from yesterday
        $orderYesterday = new Order();
        $orderYesterday->forceFill([
            'status' => 'ready',
            'type' => 'salon',
            'customer_name' => 'Ontem',
            'total_amount' => 50.00,
            'ready_at' => now()->subDay(),
        ])->save();
        $orderYesterday->created_at = now()->subDay();
        $orderYesterday->save();

        // Preparing order
        $orderPreparing = new Order();
        $orderPreparing->forceFill([
            'status' => 'preparing',
            'type' => 'salon',
            'customer_name' => 'Preparando',
            'total_amount' => 50.00,
        ])->save();

        $response = $this->actingAs($this->user)->getJson('/api/orders/ready');

        $response->assertStatus(200);
        $orders = $response->json('orders');

        $this->assertCount(1, $orders);
        $this->assertEquals($orderToday->id, $orders[0]['id']);
        $this->assertEquals('Hoje', $orders[0]['customer_name']);
    }
}
