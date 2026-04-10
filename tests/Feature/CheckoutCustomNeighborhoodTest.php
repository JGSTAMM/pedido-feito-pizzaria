<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutCustomNeighborhoodTest extends TestCase
{
    use RefreshDatabase;

    protected $size;
    protected $flavor;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->size = PizzaSize::create(['name' => 'Large', 'slices' => 8, 'max_flavors' => 2]);
        $this->flavor = PizzaFlavor::create(['name' => 'Pepperoni', 'base_price' => 20.00]);
        $this->product = Product::create(['name' => 'Coke', 'price' => 5.00, 'category' => 'Drink']);
    }

    public function test_can_checkout_with_custom_neighborhood()
    {
        $mock = \Mockery::mock(\App\Services\PaymentGatewayService::class);
        $mock->shouldReceive('createPixPayment')->once()->andReturn([
            'success' => true,
            'data' => [
                'gateway_payment_id' => '12345',
                'status' => 'pending',
                'qr_code' => 'test_qr',
                'qr_code_base64' => 'test_base64',
                'ticket_url' => 'http://test',
            ]
        ]);
        $this->app->instance(\App\Services\PaymentGatewayService::class, $mock);

        $payload = [
            'table_id' => null,
            'customer_name' => 'João',
            'customer_phone' => '11999999999',
            'payer_email' => 'joao@test.com',
            'type' => 'delivery',
            'neighborhood_id' => null,
            'custom_neighborhood' => 'Bairro Distante',
            'delivery_address' => 'Rua Longe',
            'delivery_complement' => 'Apto 1',
            'payment_method' => 'pix',
            'items' => [
                [
                    'type' => 'pizza',
                    'pizza_size_id' => $this->size->id,
                    'flavor_ids' => [$this->flavor->id],
                    'quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/online-orders', $payload);

        if ($response->status() !== 201) {
            $response->dump();
        }

        $response->assertStatus(201);
        $orderId = $response->json('order_id');
        
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'type' => 'delivery',
            'neighborhood_id' => null,
        ]);
        
        $order = Order::find($orderId);
        $this->assertNull($order->neighborhood_id);
    }
}
