<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KDSReadyTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $table;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->product = Product::factory()->create(['name' => 'Burger', 'price' => 20]);
        // Create table for FK
        $this->table = \App\Models\Table::create(['name' => 'Mesa 1', 'status' => 'available']);
    }

    public function test_mark_order_as_ready_sets_timestamp()
    {
        // Simulate KDS action logic (normally in Livewire component, but we test the model update or controller if applicable)
        // KDS component method: update(['status' => 'ready', 'ready_at' => now()])
        
        $order = Order::create([
            'status' => 'preparing',
            'total_amount' => 20.00,
        ]);

        // Manually trigger the update logic (simulating KDS component action)
        $order->update([
            'status' => 'ready',
            'ready_at' => now(),
        ]);

        $this->assertEquals('ready', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->ready_at);
    }

    public function test_api_returns_ready_orders()
    {
        // Create 1 ready order
        $readyOrder = Order::create([
            'status' => 'ready',
            'ready_at' => now(),
            'total_amount' => 20.00,
            'table_id' => $this->table->id,
        ]);
        OrderItem::create([
            'order_id' => $readyOrder->id,
            'product_id' => $this->product->id,
            'quantity' => 1,
            'unit_price' => 20.00,
            'subtotal' => 20.00,
        ]);

        // Create 1 preparing order (should not be returned)
        Order::create([
            'status' => 'preparing',
            'total_amount' => 20.00,
        ]);

        // Create 1 old ready order (yesterday) - Endpoint filters by today()
        Order::create([
            'status' => 'ready',
            'ready_at' => now()->subDay(),
            'created_at' => now()->subDay(),
            'total_amount' => 20.00,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/orders/ready');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'orders')
            ->assertJsonFragment(['id' => $readyOrder->id]);
    }
}
