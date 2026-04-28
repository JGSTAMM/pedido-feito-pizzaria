<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class WebhookSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        config(['services.mercadopago.webhook_secret' => 'test_webhook_secret']);
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
            'x-signature' => 'ts=1710000000,v1=invalid-signature',
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
        $ts = '1710000001';
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
        $ts = '1710000002';
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

    private function buildSignature(string $notificationId, string $requestId, string $ts): string
    {
        $manifest = "id:{$notificationId};request-id:{$requestId};ts:{$ts};";

        return hash_hmac('sha256', $manifest, (string) config('services.mercadopago.webhook_secret'));
    }
}
