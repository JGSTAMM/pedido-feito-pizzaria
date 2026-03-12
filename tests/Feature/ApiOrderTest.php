<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed necessary data
        $this->user = User::factory()->create();
        $this->table = Table::create(['name' => 'Table 1', 'status' => 'available']);
        $this->size = PizzaSize::create(['name' => 'Large', 'slices' => 8, 'max_flavors' => 2]);
        $this->flavor = PizzaFlavor::create(['name' => 'Pepperoni', 'base_price' => 20.00]);
        $this->product = Product::create(['name' => 'Coke', 'price' => 5.00, 'category' => 'Drink']);
    }

    public function test_can_sync_data()
    {
        $response = $this->actingAs($this->user)->getJson('/api/sync');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'tables',
                'pizza_sizes',
                'pizza_flavors',
                'products',
            ]);
    }

    public function test_can_create_order()
    {
        $this->withoutExceptionHandling();
        
        $orderData = [
            'table_id' => $this->table->id,
            'items' => [
                [
                    'type' => 'pizza',
                    'size_id' => $this->size->id,
                    'flavor_ids' => [$this->flavor->id],
                ],
                [
                    'type' => 'product',
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/api/orders', $orderData);

        if ($response->status() !== 201) {
            $response->dump();
        }

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'order_id']);

        $this->assertDatabaseHas('orders', [
            'table_id' => $this->table->id,
            'user_id' => $this->user->id,
        ]);
    }
}
