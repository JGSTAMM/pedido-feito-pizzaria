<?php

namespace App\Application\Checkout;

use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProcessPaymentWebhookAction
{
    public function __construct(private readonly PaymentGatewayService $paymentGatewayService)
    {
    }

    public function execute(Request $request): array
    {
        if (!$this->paymentGatewayService->validateWebhookSignature($request)) {
            return [
                'status' => 403,
                'payload' => [
                    'received' => false,
                    'message' => __('digital_menu.webhook.invalid_signature'),
                ],
            ];
        }

        $notificationId = $this->paymentGatewayService->extractNotificationId($request);
        if (!$notificationId) {
            return [
                'status' => 400,
                'payload' => [
                    'received' => false,
                    'message' => __('digital_menu.webhook.missing_notification_id'),
                ],
            ];
        }

        $cacheKey = "mercadopago:webhook:{$notificationId}";
        if (!Cache::add($cacheKey, now()->toISOString(), now()->addDay())) {
            return [
                'status' => 200,
                'payload' => [
                    'received' => true,
                    'duplicate' => true,
                    'message' => __('digital_menu.webhook.duplicate_notification'),
                ],
            ];
        }

        $success = $this->paymentGatewayService->handleWebhook($request->all());
        if (!$success) {
            Cache::forget($cacheKey);

            return [
                'status' => 400,
                'payload' => [
                    'received' => false,
                    'message' => __('digital_menu.webhook.processing_failed'),
                ],
            ];
        }

        return [
            'status' => 200,
            'payload' => ['received' => true],
        ];
    }
}
