<?php

namespace Tests\Feature;

use App\Application\CashRegister\BuildCashRegisterSummaryAction;
use App\Application\Checkout\ProcessOnlineCheckoutAction;
use App\Application\Printing\Formatters\ReceiptFormatter;
use App\Models\CashRegister;
use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Table;
use App\Models\User;
use App\Services\PaymentGatewayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PixPaymentOptionsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->product = Product::factory()->create([
            'name' => 'Porção de Batata Frita',
            'price' => 25.00,
            'category' => 'Porções',
        ]);

        StoreSetting::create([
            'store_name' => 'Pedido Feito',
            'phone' => '11999999999',
            'full_address' => 'Rua Teste, 100',
            'is_open' => true,
        ]);
    }

    private function openRegister(): CashRegister
    {
        return CashRegister::create([
            'user_id' => $this->admin->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);
    }

    public function test_pos_accepts_pix_balcao_and_split_payments_and_rejects_invalid_method(): void
    {
        $this->openRegister();
        $this->actingAs($this->admin);

        // Single PIX Balcão payment
        $response = $this->post('/pos/order', [
            'customer_name' => 'Cliente Balcão',
            'payments' => [
                ['method' => 'pix_balcao', 'amount' => 50.00],
            ],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 2,
                    'price' => 25.00,
                ],
            ],
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('payments', [
            'method' => 'pix_balcao',
            'amount' => 5000,
        ]);

        // Split payment: PIX Online (with gateway_id) + Dinheiro
        $splitResponse = $this->post('/pos/order', [
            'customer_name' => 'Cliente Misto',
            'payments' => [
                ['method' => 'pix', 'amount' => 30.00, 'gateway_id' => 'mp_pos_999'],
                ['method' => 'dinheiro', 'amount' => 20.00],
            ],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 2,
                    'price' => 25.00,
                ],
            ],
        ]);

        $splitResponse->assertStatus(302);
        $this->assertDatabaseHas('payments', [
            'method' => 'pix',
            'amount' => 3000,
            'gateway_id' => 'mp_pos_999',
            'gateway_status' => 'approved',
        ]);

        // Reject unknown payment method
        $invalidResponse = $this->post('/pos/order', [
            'customer_name' => 'Cliente Inválido',
            'payments' => [
                ['method' => 'bitcoin', 'amount' => 25.00],
            ],
            'items' => [
                [
                    'id' => $this->product->id,
                    'type' => 'product',
                    'quantity' => 1,
                    'price' => 25.00,
                ],
            ],
        ]);

        $invalidResponse->assertSessionHasErrors('payments.0.method');
    }

    public function test_pos_generate_pix_requires_open_register(): void
    {
        $this->actingAs($this->admin);

        // Register closed -> 400
        $closedResponse = $this->postJson('/pos/generate-pix', [
            'amount' => 45.00,
            'customer_name' => 'Maria',
        ]);

        $closedResponse->assertStatus(400);
    }

    public function test_pos_generate_pix_returns_qr_and_enforces_session_ownership_on_status(): void
    {
        $this->actingAs($this->admin);
        $this->openRegister();

        $gatewayMock = Mockery::mock(PaymentGatewayService::class);
        $gatewayMock->shouldReceive('createStandalonePixPayment')
            ->once()
            ->with(45.0, Mockery::type('string'), 'pagamento@pedidofeito.com')
            ->andReturn([
                'success' => true,
                'data' => [
                    'gateway_payment_id' => '88776655',
                    'status' => 'pending',
                    'qr_code' => '00020126580014BR.GOV.BCB.PIX',
                    'qr_code_base64' => 'iVBORw0KGgoAAAANSUhEUg==',
                    'expires_at' => now()->addMinutes(15)->toIso8601String(),
                ],
            ]);
        $gatewayMock->shouldReceive('checkGatewayPaymentStatus')
            ->once()
            ->with('88776655')
            ->andReturn('approved');

        $this->app->instance(PaymentGatewayService::class, $gatewayMock);

        $genResponse = $this->postJson('/pos/generate-pix', [
            'amount' => 45.00,
            'customer_name' => 'Maria',
        ]);

        $genResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'gateway_payment_id' => '88776655',
                'qr_code' => '00020126580014BR.GOV.BCB.PIX',
            ]);

        // Owned gateway payment ID -> 200 approved
        $statusResponse = $this->getJson('/pos/pix-status/88776655');
        $statusResponse->assertStatus(200)
            ->assertJson(['status' => 'approved']);

        // Unowned gateway payment ID -> 403 IDOR protection
        $idorResponse = $this->getJson('/pos/pix-status/99999999');
        $idorResponse->assertStatus(403);
    }

    public function test_floor_table_checkout_accepts_pix_balcao_and_cash_register_separates_pix_methods(): void
    {
        $register = $this->openRegister();
        $this->actingAs($this->admin);

        $table = Table::create([
            'name' => 'Mesa 01',
            'capacity' => 4,
            'status' => 'occupied',
        ]);

        $order = Order::create([
            'table_id' => $table->id,
            'type' => 'dine_in',
            'status' => Order::STATUS_PENDING,
            'total_amount' => 100.00,
            'customer_name' => 'Mesa 01',
            'cash_register_id' => $register->id,
            'user_id' => $this->admin->id,
        ]);

        $response = $this->post("/floor/{$table->id}/pay", [
            'payments' => [
                ['method' => 'pix_balcao', 'amount' => 6000],
                ['method' => 'pix', 'amount' => 4000],
            ],
            'service_fee_cents' => 0,
            'discount_cents' => 0,
        ]);

        $response->assertStatus(302);
        $this->assertNotNull($order->fresh()->paid_at);

        $summary = app(BuildCashRegisterSummaryAction::class)->execute($register);

        $this->assertEquals(60.00, $summary['methods']['pix_balcao']);
        $this->assertEquals(40.00, $summary['methods']['pix']);

        // Thermal receipt formatter labels them distinctly
        $connector = new \Mike42\Escpos\PrintConnectors\DummyPrintConnector;
        $printer = new \Mike42\Escpos\Printer($connector);
        $formatter = app(ReceiptFormatter::class);
        $order->refresh()->load('payments', 'items', 'table');
        $formatter->formatCustomerReceipt($printer, $order);
        $receipt = $connector->getData();
        $printer->close();
        $this->assertStringContainsString('PIX (Balc', $receipt);
        $this->assertStringContainsString('PIX Online', $receipt);
    }

    public function test_delivery_online_pix_defers_kitchen_print_until_webhook_approval(): void
    {
        $neighborhood = Neighborhood::forceCreate([
            'name' => 'Centro',
            'city' => 'Cidade Teste',
            'delivery_fee' => 8.00,
        ]);

        $gatewayMock = Mockery::mock(PaymentGatewayService::class)->makePartial();
        $gatewayMock->shouldReceive('createPixPayment')
            ->once()
            ->andReturnUsing(function (Order $order) {
                $order->update([
                    'payment_gateway_id' => 'mp_deliv_123',
                    'payment_method_online' => 'pix_online',
                    'online_payment_status' => 'pending',
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'gateway_payment_id' => 'mp_deliv_123',
                        'status' => 'pending',
                        'qr_code' => 'pix_qr_delivery_code',
                        'qr_code_base64' => 'base64data',
                    ],
                ];
            });

        $this->app->instance(PaymentGatewayService::class, $gatewayMock);

        $action = $this->app->make(ProcessOnlineCheckoutAction::class);
        $result = $action->execute([
            'type' => 'delivery',
            'customer_name' => 'Cliente Delivery',
            'customer_phone' => '11988887777',
            'neighborhood_id' => $neighborhood->id,
            'delivery_address' => 'Av. Paulista, 1000',
            'payment_method' => 'pix',
            'payer_email' => 'cliente@example.com',
            'items' => [
                [
                    'type' => 'product',
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ]);

        $this->assertEquals(201, $result['status']);

        $order = Order::latest()->first();
        $this->assertEquals(Order::STATUS_AWAITING_PAYMENT, $order->status);

        // No kitchen ticket should be enqueued while waiting for PIX payment
        $this->assertEquals(0, PrintJob::where('order_id', $order->id)->count());

        // Now simulate Mercado Pago webhook approval
        $gatewayMock->shouldReceive('fetchPaymentFromGateway')
            ->once()
            ->with('mp_deliv_123')
            ->andReturn((object) [
                'id' => 'mp_deliv_123',
                'status' => 'approved',
                'external_reference' => (string) $order->id,
            ]);

        $handled = $gatewayMock->handleWebhook([
            'type' => 'payment',
            'data' => ['id' => 'mp_deliv_123'],
        ]);

        $this->assertTrue($handled);

        $order->refresh();
        $this->assertEquals(Order::STATUS_PENDING, $order->status);
        $this->assertEquals(Order::ONLINE_PAYMENT_APPROVED, $order->online_payment_status);
        $this->assertNotNull($order->paid_at);

        // Kitchen print job must be created now (and only once even if duplicate webhook arrives)
        $this->assertEquals(1, PrintJob::where('order_id', $order->id)->count());
        $this->assertEquals(1, Payment::where('order_id', $order->id)->where('gateway_id', 'mp_deliv_123')->count());

        // Duplicate webhook must be idempotent (no second print job or payment)
        $gatewayMock->shouldReceive('fetchPaymentFromGateway')
            ->once()
            ->with('mp_deliv_123')
            ->andReturn((object) [
                'id' => 'mp_deliv_123',
                'status' => 'approved',
                'external_reference' => (string) $order->id,
            ]);

        $gatewayMock->handleWebhook([
            'type' => 'payment',
            'data' => ['id' => 'mp_deliv_123'],
        ]);

        $this->assertEquals(1, PrintJob::where('order_id', $order->id)->count());
        $this->assertEquals(1, Payment::where('order_id', $order->id)->where('gateway_id', 'mp_deliv_123')->count());
    }
}
