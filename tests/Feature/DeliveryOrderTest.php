<?php

namespace Tests\Feature;

use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryOrderTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $neighborhood;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->neighborhood = Neighborhood::create([
            'name' => 'Centro',
            'delivery_fee' => 8.00,
        ]);
        $this->product = Product::create([
            'name' => 'Pizza Margherita',
            'price' => 45.00,
            'category' => 'Pizzas',
        ]);
    }

    public function test_neighborhood_has_delivery_fee()
    {
        $this->assertEquals(8.00, (float) $this->neighborhood->delivery_fee);
    }

    public function test_can_create_delivery_order_with_address()
    {
        $order = Order::create([
            'type' => 'delivery',
            'status' => 'pending',
            'customer_name' => 'João Silva',
            'customer_phone' => '(11) 99999-0000',
            'neighborhood_id' => $this->neighborhood->id,
            'delivery_address' => 'Rua das Flores, 123',
            'delivery_complement' => 'Apto 42',
            'delivery_fee' => $this->neighborhood->delivery_fee,
            'total_amount' => 53.00, // 45 + 8 fee
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'type' => 'delivery',
            'neighborhood_id' => $this->neighborhood->id,
            'delivery_address' => 'Rua das Flores, 123',
            'delivery_complement' => 'Apto 42',
            'delivery_fee' => 8.00,
            'customer_phone' => '(11) 99999-0000',
        ]);
    }

    public function test_delivery_order_has_neighborhood_relationship()
    {
        $order = Order::create([
            'type' => 'delivery',
            'status' => 'pending',
            'customer_name' => 'Maria',
            'neighborhood_id' => $this->neighborhood->id,
            'delivery_address' => 'Av Brasil, 456',
            'delivery_fee' => $this->neighborhood->delivery_fee,
            'total_amount' => 53.00,
        ]);

        $this->assertEquals('Centro', $order->neighborhood->name);
        $this->assertEquals(8.00, (float) $order->neighborhood->delivery_fee);
    }

    public function test_delivery_fee_is_cast_to_decimal()
    {
        $order = Order::create([
            'type' => 'delivery',
            'status' => 'pending',
            'delivery_fee' => 12.50,
            'total_amount' => 57.50,
        ]);

        $this->assertIsString($order->delivery_fee); // decimal cast returns string
        $this->assertEquals('12.50', $order->delivery_fee);
    }

    public function test_non_delivery_order_has_no_neighborhood()
    {
        $order = Order::create([
            'type' => 'pickup',
            'status' => 'pending',
            'customer_name' => 'Balcão',
            'total_amount' => 45.00,
        ]);

        $order->refresh();

        $this->assertNull($order->neighborhood_id);
        $this->assertNull($order->neighborhood);
        $this->assertEquals(0, (float) $order->delivery_fee);
    }

    public function test_multiple_neighborhoods_exist()
    {
        $nb2 = Neighborhood::create(['name' => 'Jardim', 'delivery_fee' => 12.00]);
        $nb3 = Neighborhood::create(['name' => 'Vila Nova', 'delivery_fee' => 15.00]);

        $neighborhoods = Neighborhood::orderBy('name')->get();
        $this->assertCount(3, $neighborhoods);
        $this->assertEquals('Centro', $neighborhoods[0]->name);
        $this->assertEquals('Jardim', $neighborhoods[1]->name);
        $this->assertEquals('Vila Nova', $neighborhoods[2]->name);
    }
}
