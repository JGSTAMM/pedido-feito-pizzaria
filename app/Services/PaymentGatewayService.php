<?php

namespace App\Services;

use App\Application\Printing\PrintQueueService;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Payment;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Payment\PaymentRefundClient;
use MercadoPago\Exceptions\MPApiException;
use MercadoPago\MercadoPagoConfig;

class PaymentGatewayService
{
    public function __construct()
    {
        // Read access token from database first (set via admin Settings page),
        // falling back to .env config for backward compatibility.
        $dbToken = StoreSetting::first()?->mercadopago_access_token;
        $token = $dbToken ?: (string) config('services.mercadopago.access_token', '');

        MercadoPagoConfig::setAccessToken($token);
    }

    public function extractNotificationId(Request $request): ?string
    {
        $notificationId = $request->input('data.id')
            ?? $request->query('data.id')
            ?? $request->input('id')
            ?? $request->query('id');

        if ($notificationId === null || ! is_scalar($notificationId)) {
            return null;
        }

        $clean = trim((string) $notificationId);

        return $clean !== '' ? $clean : null;
    }

    public function validateWebhookSignature(Request $request): bool
    {
        $secret = (string) config('services.mercadopago.webhook_secret');
        if ($secret === '') {
            if (app()->isProduction()) {
                Log::error('Mercado Pago webhook rejected: MERCADOPAGO_WEBHOOK_SECRET is not configured in production.');

                return false;
            }

            // Non-production local/dev fallback: require existing bound order before checking gateway
            Log::warning('Mercado Pago webhook secret is not configured. Falling back to direct API verification (non-production only).');

            $notificationId = $this->extractNotificationId($request);
            if ($notificationId === null || ! preg_match('/^\d{1,25}$/', $notificationId)) {
                return false;
            }

            if (! Order::where('payment_gateway_id', $notificationId)->exists()) {
                return false;
            }

            try {
                $payment = $this->fetchPaymentFromGateway($notificationId);
                return isset($payment->id);
            } catch (\Throwable $e) {
                Log::error('Direct gateway payment verification failed: ' . $e->getMessage());
                return false;
            }
        }

        $signatureHeader = (string) $request->header('x-signature', '');
        $requestId = (string) $request->header('x-request-id', '');
        $notificationId = $this->extractNotificationId($request);

        if ($signatureHeader === '' || $requestId === '' || $notificationId === null) {
            return false;
        }

        $parts = collect(explode(',', $signatureHeader))
            ->map(fn (string $segment) => trim($segment))
            ->filter();

        $signatureData = [];
        foreach ($parts as $part) {
            [$key, $value] = array_pad(explode('=', $part, 2), 2, null);
            if ($key !== null && $value !== null) {
                $signatureData[strtolower(trim($key))] = trim($value);
            }
        }

        $ts = $signatureData['ts'] ?? null;
        $receivedSignature = $signatureData['v1'] ?? null;

        if ($ts === null || $receivedSignature === null) {
            return false;
        }

        // Replay attack prevention: maximum 300 seconds drift allowed
        if (abs(time() - (int) $ts) > 300) {
            Log::warning('Mercado Pago webhook rejected: timestamp drift exceeds 300s', [
                'ts' => $ts,
                'current_time' => time(),
            ]);

            return false;
        }

        $manifest = "id:{$notificationId};request-id:{$requestId};ts:{$ts};";
        $computedSignature = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($computedSignature, $receivedSignature);
    }

    /**
     * Create a PIX payment via Mercado Pago.
     *
     * @param  string  $payerEmail  Email do pagador (obrigatório para PIX)
     * @return array ['success' => bool, 'data' => [...]]
     */
    public function createPixPayment(Order $order, string $payerEmail, ?float $amount = null, int $maxRetries = 3): array
    {
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $client = new PaymentClient;

                $requestBody = [
                    'transaction_amount' => $amount !== null ? (float) $amount : (float) $order->total_amount,
                    'description' => "Pedido #{$order->id} - Pedido Feito Pizzaria",
                    'payment_method_id' => 'pix',
                    'payer' => [
                        'email' => $payerEmail,
                        'first_name' => 'Cliente',
                        'last_name' => 'PedidoFeito',
                    ],
                    'external_reference' => (string) $order->id . '_' . time(),
                ];

                $webhookUrl = config('services.mercadopago.webhook_url');
                if ($webhookUrl && str_starts_with($webhookUrl, 'https://')) {
                    $requestBody['notification_url'] = $webhookUrl;
                }

                $options = new RequestOptions;
                $options->setCustomHeaders([
                    'X-Idempotency-Key: '.(string) $order->id.'_'.time().'_'.$attempt,
                ]);

                Log::info("Creating PIX payment for order #{$order->id} (Attempt {$attempt})", $requestBody);
                $payment = $client->create($requestBody, $options);

                // Extract PIX data
                $pixData = $payment->point_of_interaction?->transaction_data ?? null;

                // Update order with gateway info
                $order->update([
                    'payment_gateway_id' => $payment->id,
                    'payment_method_online' => 'pix',
                    'online_payment_status' => $payment->status,
                    'pix_qr_code' => $pixData?->qr_code ?? null,
                    'pix_qr_code_base64' => $pixData?->qr_code_base64 ?? null,
                ]);

                Log::info("PIX payment created for order #{$order->id}", [
                    'gateway_id' => $payment->id,
                    'status' => $payment->status,
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'gateway_payment_id' => $payment->id,
                        'status' => $payment->status,
                        'qr_code' => $pixData?->qr_code ?? null,
                        'qr_code_base64' => $pixData?->qr_code_base64 ?? null,
                        'ticket_url' => $pixData?->ticket_url ?? null,
                        'expires_at' => $payment->date_of_expiration ?? null,
                    ],
                ];
            } catch (MPApiException $e) {
                $response = $e->getApiResponse();
                $statusCode = $response->getStatusCode();
                $content = $response->getContent();

                Log::error("Mercado Pago API error creating PIX for order #{$order->id}", [
                    'status' => $statusCode,
                    'content' => $content,
                    'attempt' => $attempt,
                ]);

                // Detect circuit breaker / internal errors from sandbox
                $errorMessage = $content['message'] ?? '';
                $isCircuitBreaker = str_contains(json_encode($content), 'circuit breaker');
                $isCommunicationError = str_contains($errorMessage, 'communication_error');
                $isInternalError = ($statusCode === 500) || str_contains($errorMessage, 'internal');

                // Retry on transient sandbox errors
                if (($isCommunicationError || $isCircuitBreaker || $isInternalError) && $attempt < $maxRetries) {
                    $delay = $attempt * 2; // 2s, 4s exponential backoff
                    Log::warning("Retrying PIX payment for order #{$order->id} (attempt {$attempt}/{$maxRetries}) after {$delay}s delay");
                    sleep($delay);
                    continue; // Go to next loop iteration
                }

                if ($isCircuitBreaker || $isInternalError) {
                    return [
                        'success' => false,
                        'error' => 'O serviço PIX do Mercado Pago está temporariamente indisponível (sandbox). Tente novamente em alguns minutos ou use outro método de pagamento.',
                        'details' => $content,
                    ];
                }

                return [
                    'success' => false,
                    'error' => 'Não foi possível gerar o pagamento PIX no momento. Verifique os dados ou tente outro método.',
                ];
            } catch (\Exception $e) {
                Log::error("Error creating PIX payment for order #{$order->id} (Attempt {$attempt}): ".$e->getMessage(), [
                    'exception' => $e,
                ]);

                if ($attempt < $maxRetries) {
                    $delay = $attempt * 2;
                    Log::warning("Retrying PIX payment for order #{$order->id} due to generic exception (attempt {$attempt}/{$maxRetries}) after {$delay}s delay");
                    sleep($delay);
                    continue;
                }

                return [
                    'success' => false,
                    'error' => 'Erro interno ao processar pagamento PIX. Tente novamente.',
                ];
            }
        }
        
        return [
            'success' => false,
            'error' => 'Erro interno ao processar pagamento.',
        ];
    }

    /**
     * Create a standalone PIX payment via Mercado Pago (used by POS counter checkout before order creation).
     */
    public function createStandalonePixPayment(
        float $amount,
        string $description = 'Venda Balcão - Pedido Feito Pizzaria',
        string $payerEmail = 'pagamento@pedidofeito.com',
        int $maxRetries = 3
    ): array {
        $reference = 'pos_'.uniqid('', true);

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $client = new PaymentClient;

                $requestBody = [
                    'transaction_amount' => round($amount, 2),
                    'description' => $description,
                    'payment_method_id' => 'pix',
                    'payer' => [
                        'email' => $payerEmail,
                        'first_name' => 'Cliente',
                        'last_name' => 'Balcao',
                    ],
                    'external_reference' => $reference,
                ];

                $webhookUrl = config('services.mercadopago.webhook_url');
                if ($webhookUrl && str_starts_with($webhookUrl, 'https://')) {
                    $requestBody['notification_url'] = $webhookUrl;
                }

                $options = new RequestOptions;
                $options->setCustomHeaders([
                    'X-Idempotency-Key: '.$reference.'_'.$attempt,
                ]);

                Log::info("Creating standalone POS PIX payment (Attempt {$attempt})", [
                    'amount' => $amount,
                    'reference' => $reference,
                ]);

                $payment = $client->create($requestBody, $options);
                $pixData = $payment->point_of_interaction?->transaction_data ?? null;

                return [
                    'success' => true,
                    'data' => [
                        'gateway_payment_id' => (string) $payment->id,
                        'status' => $payment->status,
                        'qr_code' => $pixData?->qr_code ?? null,
                        'qr_code_base64' => $pixData?->qr_code_base64 ?? null,
                        'ticket_url' => $pixData?->ticket_url ?? null,
                        'expires_at' => $payment->date_of_expiration ?? null,
                    ],
                ];
            } catch (MPApiException $e) {
                $response = $e->getApiResponse();
                $statusCode = $response->getStatusCode();
                $content = $response->getContent();
                $errorMessage = $content['message'] ?? '';

                Log::error('Mercado Pago API error creating standalone POS PIX', [
                    'status' => $statusCode,
                    'content' => $content,
                    'attempt' => $attempt,
                ]);

                $isCircuitBreaker = str_contains(json_encode($content), 'circuit breaker');
                $isCommunicationError = str_contains($errorMessage, 'communication_error');
                $isInternalError = ($statusCode === 500) || str_contains($errorMessage, 'internal');

                if (($isCommunicationError || $isCircuitBreaker || $isInternalError) && $attempt < $maxRetries) {
                    sleep($attempt * 2);

                    continue;
                }

                return [
                    'success' => false,
                    'error' => 'Não foi possível gerar o QR Code PIX no momento.',
                ];
            } catch (\Exception $e) {
                Log::error('Error creating standalone POS PIX payment: '.$e->getMessage(), [
                    'attempt' => $attempt,
                ]);

                if ($attempt < $maxRetries) {
                    sleep($attempt * 2);

                    continue;
                }

                return [
                    'success' => false,
                    'error' => 'Erro interno ao processar pagamento PIX.',
                ];
            }
        }

        return [
            'success' => false,
            'error' => 'Erro interno ao processar pagamento.',
        ];
    }

    /**
     * Check payment status directly from gateway by gateway payment ID.
     */
    public function checkGatewayPaymentStatus(string|int $gatewayPaymentId): ?string
    {
        try {
            $payment = $this->fetchPaymentFromGateway($gatewayPaymentId);

            return $payment->status ?? null;
        } catch (\Exception $e) {
            Log::error("Error checking gateway payment status #{$gatewayPaymentId}: ".$e->getMessage());

            return null;
        }
    }

    /**
     * Create a card payment via Mercado Pago.
     *
     * @param  string  $token  Card token from MercadoPago.js
     * @param  int  $installments  Número de parcelas
     */
    public function createCardPayment(
        Order $order,
        string $token,
        string $payerEmail,
        int $installments = 1,
        string $onlineMethod = 'credito_online'
    ): array {
        try {
            $client = new PaymentClient;

            $requestBody = [
                'transaction_amount' => (float) $order->total_amount,
                'description' => "Pedido #{$order->id} - Pedido Feito Pizzaria",
                'token' => $token,
                'installments' => $installments,
                'payer' => [
                    'email' => $payerEmail,
                ],
                'external_reference' => (string) $order->id . '_' . time(),
            ];

            $webhookUrl = config('services.mercadopago.webhook_url');
            if ($webhookUrl && str_starts_with($webhookUrl, 'https://')) {
                $requestBody['notification_url'] = $webhookUrl;
            }

            $payment = $client->create($requestBody);

            $order->update([
                'payment_gateway_id' => $payment->id,
                'payment_method_online' => $onlineMethod,
                'online_payment_status' => $payment->status,
            ]);

            // If rejected or cancelled immediately on synchronous card submission, report failure so caller rolls back
            if (in_array((string) $payment->status, ['rejected', 'cancelled'], true)) {
                return [
                    'success' => false,
                    'error' => 'Pagamento com cartão recusado pela operadora. Verifique os dados ou utilize outro cartão.',
                    'data' => [
                        'gateway_payment_id' => $payment->id,
                        'status' => $payment->status,
                        'status_detail' => $payment->status_detail ?? null,
                    ],
                ];
            }

            // If approved immediately
            if ($payment->status === 'approved') {
                $this->markOrderAsPaidOnline($order, $payment->id);
            }

            Log::info("Card payment created for order #{$order->id}", [
                'gateway_id' => $payment->id,
                'status' => $payment->status,
            ]);

            return [
                'success' => true,
                'data' => [
                    'gateway_payment_id' => $payment->id,
                    'status' => $payment->status,
                    'status_detail' => $payment->status_detail ?? null,
                ],
            ];
        } catch (MPApiException $e) {
            Log::error("Mercado Pago API error creating card payment for order #{$order->id}", [
                'status' => $e->getApiResponse()->getStatusCode(),
                'content' => $e->getApiResponse()->getContent(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao processar pagamento com cartão.',
            ];
        } catch (\Exception $e) {
            Log::error("Error creating card payment for order #{$order->id}: ".$e->getMessage(), [
                'exception' => $e,
            ]);

            return [
                'success' => false,
                'error' => 'Erro interno ao processar pagamento com cartão.',
            ];
        }
    }

    /**
     * Process webhook notification from Mercado Pago.
     */
    public function handleWebhook(array $payload): bool
    {
        if (($payload['type'] ?? '') !== 'payment') {
            return true; // Not a payment notification, ignore
        }

        $paymentId = $payload['data']['id'] ?? null;
        if (! $paymentId) {
            Log::warning('Webhook received without payment ID');

            return false;
        }

        try {
            $payment = $this->fetchPaymentFromGateway($paymentId);
            $rawRef = (string) ($payment->external_reference ?? '');
            $cleanOrderId = explode('_', $rawRef)[0];

            DB::beginTransaction();
            try {
                /** @var Order|null $order */
                $order = ($cleanOrderId !== '' ? Order::where('id', $cleanOrderId)->lockForUpdate()->first() : null)
                    ?? Order::where('payment_gateway_id', (string) $paymentId)->lockForUpdate()->first();

                if (! $order) {
                    DB::rollBack();
                    Log::warning("Webhook: Order not found for external_reference: {$rawRef}");

                    return false;
                }

                // Prevent a stale or unrelated payment notification from overwriting a bound gateway payment ID
                if (! empty($order->payment_gateway_id) && (string) $order->payment_gateway_id !== (string) $paymentId) {
                    DB::commit();
                    Log::warning("Webhook: Ignoring payment #{$paymentId} because order #{$order->id} is bound to #{$order->payment_gateway_id}");

                    return true;
                }

                $isTableFloorPix = in_array((string) $order->type, ['dine_in', 'salon'], true)
                    && $order->status !== Order::STATUS_AWAITING_PAYMENT;

                if ($payment->status === 'approved') {
                    $currency = strtoupper((string) ($payment->currency_id ?? 'BRL'));
                    if ($currency !== 'BRL') {
                        DB::rollBack();
                        Log::error("Webhook: Currency mismatch on payment #{$paymentId} for order #{$order->id}: {$currency}");

                        return false;
                    }

                    if (! $isTableFloorPix && isset($payment->transaction_amount)) {
                        $expectedAmount = (float) $order->total_amount;
                        $paidAmount = (float) $payment->transaction_amount;
                        if ($paidAmount + 0.01 < $expectedAmount) {
                            DB::rollBack();
                            Log::error("Webhook: Amount mismatch on payment #{$paymentId} for order #{$order->id}", [
                                'expected' => $expectedAmount,
                                'received' => $paidAmount,
                            ]);

                            return false;
                        }
                    }
                }

                $alreadyPaidOrCompleted = $order->paid_at !== null
                    || $order->online_payment_status === Order::ONLINE_PAYMENT_APPROVED
                    || in_array((string) $order->status, [Order::STATUS_COMPLETED, Order::STATUS_PAID, 'delivered'], true);

                // Never allow a late rejected/cancelled webhook to clobber an already paid or completed order
                if (in_array((string) $payment->status, ['rejected', 'cancelled'], true) && $alreadyPaidOrCompleted) {
                    DB::commit();
                    Log::info("Webhook: Ignoring late {$payment->status} notification for already paid/completed order #{$order->id}");

                    return true;
                }

                $previousStatus = (string) ($order->online_payment_status ?? $order->status ?? 'awaiting_payment');
                $postCommitEvents = [];

                Log::info("Webhook: Payment #{$paymentId} for order #{$order->id} — status: {$payment->status}");

                switch ($payment->status) {
                    case 'approved':
                        $this->markOrderAsPaidOnline($order, $paymentId);
                        $postCommitEvents[] = new OrderStatusUpdated(
                            orderId: $order->id,
                            status: (string) $order->fresh()->status,
                            previousStatus: $previousStatus,
                            type: $order->type,
                            tableId: $order->table_id,
                        );
                        break;

                    case 'rejected':
                    case 'cancelled':
                        $order->update([
                            'online_payment_status' => $payment->status,
                            'status' => Order::STATUS_REJECTED,
                            'rejected_at' => now(),
                            'rejection_reason' => 'Pagamento '.($payment->status === 'rejected' ? 'rejeitado' : 'cancelado'),
                        ]);
                        $postCommitEvents[] = new OrderStatusUpdated(
                            orderId: $order->id,
                            status: Order::STATUS_REJECTED,
                            previousStatus: $previousStatus,
                            type: $order->type,
                            tableId: $order->table_id,
                        );
                        break;

                    case 'pending':
                    case 'in_process':
                        if (! $alreadyPaidOrCompleted) {
                            $order->update(['online_payment_status' => $payment->status]);
                        }
                        break;

                    case 'refunded':
                        $order->update(['online_payment_status' => Order::ONLINE_PAYMENT_REFUNDED]);
                        break;
                }

                DB::commit();
            } catch (\Throwable $txEx) {
                DB::rollBack();
                throw $txEx;
            }

            foreach ($postCommitEvents as $evt) {
                try {
                    event($evt);
                } catch (\Throwable $broadcastEx) {
                    Log::warning('Broadcast failed after webhook processing: '.$broadcastEx->getMessage());
                }
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Error processing webhook: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Retrieve payment information from Mercado Pago API.
     */
    public function fetchPaymentFromGateway(string|int $paymentId): object
    {
        $client = new PaymentClient;

        return $client->get($paymentId);
    }

    /**
     * Verify that a gateway payment is approved in BRL for at least the expected amount.
     *
     * @return array{approved: bool, status: ?string, amount: ?float, currency: ?string}
     */
    public function verifyApprovedGatewayPayment(string|int $paymentId, float $expectedAmount): array
    {
        try {
            $payment = $this->fetchPaymentFromGateway($paymentId);
            $status = isset($payment->status) ? (string) $payment->status : null;
            $currency = isset($payment->currency_id) ? strtoupper((string) $payment->currency_id) : null;
            $amount = isset($payment->transaction_amount) ? (float) $payment->transaction_amount : null;

            $approved = $status === 'approved'
                && $currency === 'BRL'
                && $amount !== null
                && ($amount + 0.01) >= $expectedAmount;

            return [
                'approved' => $approved,
                'status' => $status,
                'amount' => $amount,
                'currency' => $currency,
            ];
        } catch (\Throwable $e) {
            Log::error("Error verifying gateway payment #{$paymentId}: ".$e->getMessage());

            return [
                'approved' => false,
                'status' => null,
                'amount' => null,
                'currency' => null,
            ];
        }
    }

    /**
     * Mark order as paid online and create payment record.
     */
    public function markOrderAsPaidOnline(Order $order, string|int|null $gatewayPaymentId): void
    {
        $isDineInOrSalon = in_array((string) $order->type, ['dine_in', 'salon'], true);

        if ($isDineInOrSalon && $order->status !== Order::STATUS_AWAITING_PAYMENT) {
            // Floor table checkout partial/full PIX QR payment (settled later by FloorController::payAndClose)
            $order->update([
                'online_payment_status' => Order::ONLINE_PAYMENT_APPROVED,
            ]);

            return;
        }

        $wasAwaitingPayment = $order->status === Order::STATUS_AWAITING_PAYMENT;
        $alreadyApproved = $order->online_payment_status === Order::ONLINE_PAYMENT_APPROVED && $order->paid_at !== null;

        $nextStatus = in_array((string) $order->status, ['preparing', 'ready', 'completed', 'delivered'], true)
            ? $order->status
            : Order::STATUS_PENDING;

        $order->update([
            'status' => $nextStatus,
            'online_payment_status' => Order::ONLINE_PAYMENT_APPROVED,
            'paid_at' => $order->paid_at ?? now(),
        ]);

        // Create local payment record idempotently
        $paymentAlreadyRecorded = ($gatewayPaymentId !== null && Payment::where('gateway_id', (string) $gatewayPaymentId)->exists())
            || Payment::where('order_id', $order->id)->where('amount', $order->total_amount)->exists();

        if (! $paymentAlreadyRecorded) {
            Payment::create([
                'order_id' => $order->id,
                'method' => $order->payment_method_online ?? 'pix_online',
                'amount' => $order->total_amount,
                'gateway_id' => $gatewayPaymentId !== null ? (string) $gatewayPaymentId : null,
                'gateway_status' => 'approved',
                'paid_at' => now(),
            ]);
        }

        if ($wasAwaitingPayment && ! $alreadyApproved) {
            try {
                app(PrintQueueService::class)->enqueueKitchenTicket($order);
            } catch (\Throwable $queueEx) {
                Log::warning('Failed to enqueue kitchen print job after online payment approval: '.$queueEx->getMessage());
            }

            try {
                event(new OrderCreated(
                    orderId: $order->id,
                    status: Order::STATUS_PENDING,
                    type: $order->type,
                    shortCode: $order->short_code ?? '',
                    tableId: $order->table_id,
                ));
            } catch (\Throwable $broadcastEx) {
                Log::warning('Broadcast failed after online payment approval: '.$broadcastEx->getMessage());
            }
        }
    }

    /**
     * Refund a payment (for rejected orders).
     */
    public function refundPayment(Order $order): array
    {
        if (! $order->payment_gateway_id) {
            return ['success' => false, 'error' => 'Pedido não possui pagamento online.'];
        }

        try {
            $client = new PaymentRefundClient;
            $refund = $client->refundTotal((int) $order->payment_gateway_id);

            $order->update(['online_payment_status' => Order::ONLINE_PAYMENT_REFUNDED]);

            Log::info("Refund processed for order #{$order->id}, gateway payment #{$order->payment_gateway_id}");

            return ['success' => true, 'refund_id' => $refund->id ?? null];
        } catch (\Exception $e) {
            Log::error("Error refunding order #{$order->id}: ".$e->getMessage());

            return ['success' => false, 'error' => 'Erro ao processar estorno.'];
        }
    }

    /**
     * Check payment status directly from gateway.
     */
    public function checkPaymentStatus(Order $order): ?string
    {
        if (! $order->payment_gateway_id) {
            return null;
        }

        try {
            $client = new PaymentClient;
            $payment = $client->get($order->payment_gateway_id);

            return $payment->status;
        } catch (\Exception $e) {
            Log::error("Error checking payment status for order #{$order->id}: ".$e->getMessage());

            return null;
        }
    }
}
