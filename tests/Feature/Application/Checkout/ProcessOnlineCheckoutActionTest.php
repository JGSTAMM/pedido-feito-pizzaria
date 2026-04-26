<?php

namespace Tests\Feature\Application\Checkout;

use App\Application\Checkout\ProcessOnlineCheckoutAction;
use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\Product;
use App\Services\PaymentGatewayService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ProcessOnlineCheckoutActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_order_and_payment_successfully()
    {
        // 1. Arrange
        $product = Product::factory()->create(['price' => 20.00]);
        $neighborhood = Neighborhood::forceCreate([
            'name' => 'Teste',
            'city' => 'Teste City',
            'delivery_fee' => 5.00
        ]);

        $validatedData = [
            'type' => 'delivery',
            'customer_name' => 'John Doe',
            'customer_phone' => '11999999999',
            'neighborhood_id' => $neighborhood->id,
            'delivery_address' => 'Rua Teste, 123',
            'payment_method' => 'pix',
            'payer_email' => 'john@example.com',
            'items' => [
                [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'quantity' => 2,
                ]
            ],
        ];

        // Mock PaymentGatewayService
        $paymentGatewayMock = Mockery::mock(PaymentGatewayService::class);
        $paymentGatewayMock->shouldReceive('createPixPayment')
            ->once()
            ->andReturn([
                'success' => true,
                'data' => [
                    'id' => '123456789',
                    'qr_code' => 'qrcode123',
                    'ticket_url' => 'http://example.com/ticket',
                ]
            ]);

        $this->app->instance(PaymentGatewayService::class, $paymentGatewayMock);

        // Resolve action with mocked dependency
        $action = $this->app->make(ProcessOnlineCheckoutAction::class);

        // 2. Act
        $response = $action->execute($validatedData);

        // 3. Assert
        $this->assertEquals(201, $response['status']);
        $this->assertTrue($response['payload']['success']);
        $this->assertEquals('123456789', $response['payload']['payment']['id']);

        $this->assertDatabaseHas('orders', [
            'customer_name' => 'John Doe',
            'total_amount' => 45.00, // (20 * 2) + 5 delivery fee
            'status' => Order::STATUS_AWAITING_PAYMENT,
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'subtotal' => 40.00,
        ]);
    }

    public function test_it_rolls_back_transaction_on_payment_failure()
    {
        // 1. Arrange
        $product = Product::factory()->create(['price' => 20.00]);

        $validatedData = [
            'type' => 'pickup',
            'customer_name' => 'Jane Doe',
            'customer_phone' => '11999999999',
            'payment_method' => 'card',
            'card_token' => 'tok_123',
            'payer_email' => 'jane@example.com',
            'items' => [
                [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'quantity' => 1,
                ]
            ],
        ];

        // Mock PaymentGatewayService to throw an Exception
        $paymentGatewayMock = Mockery::mock(PaymentGatewayService::class);
        $paymentGatewayMock->shouldReceive('createCardPayment')
            ->once()
            ->andThrow(new Exception('Payment Gateway Error'));

        $this->app->instance(PaymentGatewayService::class, $paymentGatewayMock);

        $action = $this->app->make(ProcessOnlineCheckoutAction::class);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);

        // 2. Act
        $response = $action->execute($validatedData);

        // 3. Assert
        $this->assertEquals(500, $response['status']);
        $this->assertFalse($response['payload']['success']);

        // Assert rollback was successful (no partial data saved)
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }
}
