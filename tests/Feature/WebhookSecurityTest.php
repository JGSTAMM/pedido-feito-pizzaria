<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Models\StoreSetting;
use App\Services\PaymentGatewayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class WebhookSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config(['services.mercadopago.webhook_secret' => 'test_webhook_secret']);
        StoreSetting::create([
            'mercadopago_access_token' => 'TEST-mock-token'
        ]);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $payload = [
            'type' => 'merchant_order',
            'data' => [
                'id' => 'notification-100',
            ],
        ];

        $response = $this->postJson('/api/payments/webhook', $payload, [
            'x-request-id' => 'req-invalid',
            'x-signature' => 'ts=' . time() . ',v1=invalid-signature',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'received' => false,
                'message' => 'digital_menu.webhook.invalid_signature',
            ]);
    }

    public function test_webhook_rejects_expired_timestamp_replay_attack(): void
    {
        $payload = [
            'type' => 'merchant_order',
            'data' => [
                'id' => 'notification-replay',
            ],
        ];

        $requestId = 'req-replay';
        // Timestamp older than 300 seconds (5 minutes)
        $expiredTs = (string) (time() - 301);
        $signature = $this->buildSignature('notification-replay', $requestId, $expiredTs);

        $response = $this->postJson('/api/payments/webhook', $payload, [
            'x-request-id' => $requestId,
            'x-signature' => "ts={$expiredTs},v1={$signature}",
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'received' => false,
                'message' => 'digital_menu.webhook.invalid_signature',
            ]);
    }

    public function test_webhook_accepts_valid_signature(): void
    {
        $payload = [
            'type' => 'merchant_order',
            'data' => [
                'id' => 'notification-200',
            ],
        ];

        $requestId = 'req-valid';
        $ts = (string) time();
        $signature = $this->buildSignature('notification-200', $requestId, $ts);

        $response = $this->postJson('/api/payments/webhook', $payload, [
            'x-request-id' => $requestId,
            'x-signature' => "ts={$ts},v1={$signature}",
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'received' => true,
            ]);
    }

    public function test_webhook_is_idempotent_for_same_notification(): void
    {
        $payload = [
            'type' => 'merchant_order',
            'data' => [
                'id' => 'notification-300',
            ],
        ];

        $requestId = 'req-idempotent';
        $ts = (string) time();
        $signature = $this->buildSignature('notification-300', $requestId, $ts);
        $headers = [
            'x-request-id' => $requestId,
            'x-signature' => "ts={$ts},v1={$signature}",
        ];

        $firstResponse = $this->postJson('/api/payments/webhook', $payload, $headers);
        $firstResponse->assertStatus(200)
            ->assertJson([
                'received' => true,
            ]);

        $secondResponse = $this->postJson('/api/payments/webhook', $payload, $headers);
        $secondResponse->assertStatus(200)
            ->assertJson([
                'received' => true,
                'duplicate' => true,
                'message' => 'digital_menu.webhook.duplicate_notification',
            ]);
    }

    public function test_order_is_resolved_when_external_reference_has_timestamp_suffix(): void
    {
        $order = Order::create([
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'type' => 'salon',
            'total_amount' => 50.00,
            'customer_name' => 'Cliente PIX',
        ]);

        $externalReferenceWithTimestamp = $order->id . '_' . time();

        // Create mock payment object returned by MercadoPago SDK
        $mockPayment = (object) [
            'id' => 999888777,
            'status' => 'approved',
            'external_reference' => $externalReferenceWithTimestamp,
            'transaction_amount' => 50.00,
        ];

        // Partially mock PaymentGatewayService to inject mock payment response without calling external API
        $service = $this->getMockBuilder(PaymentGatewayService::class)
            ->onlyMethods(['fetchPaymentFromGateway'])
            ->getMock();

        $service->method('fetchPaymentFromGateway')
            ->willReturn($mockPayment);

        $result = $service->handleWebhook([
            'type' => 'payment',
            'data' => ['id' => '999888777'],
        ]);

        $this->assertTrue($result);

        $order->refresh();
        $this->assertEquals(Order::ONLINE_PAYMENT_APPROVED, $order->online_payment_status);
        $this->assertEquals(Order::STATUS_PENDING, $order->status);
        $this->assertNotNull($order->paid_at);
    }

    private function buildSignature(string $notificationId, string $requestId, string $ts): string
    {
        $manifest = "id:{$notificationId};request-id:{$requestId};ts:{$ts};";

        return hash_hmac('sha256', $manifest, (string) config('services.mercadopago.webhook_secret'));
    }
}
