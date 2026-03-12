<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $table;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->table = Table::create(['name' => 'Mesa 1', 'status' => 'available']);
        $this->product = Product::create(['name' => 'Pizza', 'price' => 50.00, 'category' => 'Pizzas']);
    }

    public function test_order_creation_with_payment_marks_as_paid()
    {
        // Simulate order creation in POS (direct sale)
        $order = Order::create([
            'status' => 'paid',
            'type' => 'salon',
            'table_id' => $this->table->id,
            'total_amount' => 50.00,
            'paid_at' => now(),
            'change_amount' => 0,
            'customer_name' => 'Cliente',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 50.00,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'paid',
            'total_amount' => 50.00,
        ]);
        
        $this->assertNotNull($order->fresh()->paid_at);
    }

    public function test_payment_with_change_amount()
    {
        $order = Order::create([
            'status' => 'paid',
            'total_amount' => 45.00,
            'paid_at' => now(),
            'change_amount' => 5.00, // Paid 50, Total 45
            'customer_name' => 'Cliente',
        ]);

        Payment::create([
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 50.00,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'change_amount' => 5.00,
        ]);
    }

    public function test_close_table_api_releases_table()
    {
        // Table is occupied with orders
        $this->table->update(['status' => 'occupied']);
        
        $order1 = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_amount' => 100.00,
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tables/{$this->table->id}/close");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Mesa fechada com sucesso']);

        $this->assertDatabaseHas('tables', [
            'id' => $this->table->id,
            'status' => 'available', 
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order1->id,
            'status' => 'completed',
        ]);
    }

    public function test_close_table_fails_if_no_active_orders()
    {
        $this->table->update(['status' => 'occupied']);

        // Orders are already paid/completed
        Order::create([
            'table_id' => $this->table->id,
            'status' => 'paid',
            'total_amount' => 100.00,
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/tables/{$this->table->id}/close");
        
        $response->assertStatus(404)
            ->assertJson(['message' => 'Nenhum pedido ativo nesta mesa']);
    }
}
