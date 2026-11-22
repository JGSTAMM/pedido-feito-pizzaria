<?php

namespace App\Application\Checkout;

use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProcessPaymentWebhookAction
{
    public function __construct(private readonly PaymentGatewayService $paymentGatewayService) {}

    public function execute(Request $request): array
    {
        if (! $this->paymentGatewayService->validateWebhookSignature($request)) {
            return [
                'status' => 403,
                'payload' => [
                    'received' => false,
                    'message' => 'digital_menu.webhook.invalid_signature',
                ],
            ];
        }

        $notificationId = $this->paymentGatewayService->extractNotificationId($request);
        if (! $notificationId) {
            return [
                'status' => 400,
                'payload' => [
                    'received' => false,
                    'message' => 'digital_menu.webhook.missing_notification_id',
                ],
            ];
        }

        $requestId = trim((string) $request->header('x-request-id', ''));
        $statusHint = trim((string) ($request->input('action') ?? $request->input('data.status') ?? ''));
        $idempotencySuffix = $requestId !== ''
            ? "req:{$requestId}"
            : ($statusHint !== '' ? "act:{$statusHint}" : 'payload:'.substr(hash('sha256', (string) $request->getContent()), 0, 16));

        $cacheKey = "mercadopago:webhook:{$notificationId}:{$idempotencySuffix}";
        if (! Cache::add($cacheKey, now()->toISOString(), now()->addDay())) {
            return [
                'status' => 200,
                'payload' => [
                    'received' => true,
                    'duplicate' => true,
                    'message' => 'digital_menu.webhook.duplicate_notification',
                ],
            ];
        }

        $success = $this->paymentGatewayService->handleWebhook($request->all());
        if (! $success) {
            Cache::forget($cacheKey);

            return [
                'status' => 400,
                'payload' => [
                    'received' => false,
                    'message' => 'digital_menu.webhook.processing_failed',
                ],
            ];
        }

        return [
            'status' => 200,
            'payload' => ['received' => true],
        ];
    }
}
