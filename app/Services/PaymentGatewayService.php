<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Exceptions\MPApiException;

class PaymentGatewayService
{
    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
    }

    /**
     * Create a PIX payment via Mercado Pago.
     *
     * @param  Order  $order
     * @param  string $payerEmail  Email do pagador (obrigatório para PIX)
     * @return array  ['success' => bool, 'data' => [...]]
     */
    public function createPixPayment(Order $order, string $payerEmail): array
    {
        try {
            $client = new PaymentClient();

            $requestBody = [
                'transaction_amount' => (float) $order->total_amount,
                'description' => "Pedido #{$order->id} - Pedido Feito Pizzaria",
                'payment_method_id' => 'pix',
                'payer' => [
                    'email' => $payerEmail,
                ],
                'external_reference' => (string) $order->id,
                'notification_url' => config('services.mercadopago.webhook_url'),
            ];

            $payment = $client->create($requestBody);

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
            Log::error("Mercado Pago API error creating PIX for order #{$order->id}", [
                'status' => $e->getApiResponse()->getStatusCode(),
                'content' => $e->getApiResponse()->getContent(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao gerar pagamento PIX. Tente novamente.',
                'details' => $e->getApiResponse()->getContent(),
            ];
        } catch (\Exception $e) {
            Log::error("Error creating PIX payment for order #{$order->id}: " . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Erro interno ao processar pagamento.',
            ];
        }
    }

    /**
     * Create a card payment via Mercado Pago.
     *
     * @param  Order  $order
     * @param  string $token          Card token from MercadoPago.js
     * @param  string $payerEmail
     * @param  int    $installments   Número de parcelas
     * @return array
     */
    public function createCardPayment(
        Order $order,
        string $token,
        string $payerEmail,
        int $installments = 1
    ): array {
        try {
            $client = new PaymentClient();

            $requestBody = [
                'transaction_amount' => (float) $order->total_amount,
                'description' => "Pedido #{$order->id} - Pedido Feito Pizzaria",
                'token' => $token,
                'installments' => $installments,
                'payer' => [
                    'email' => $payerEmail,
                ],
                'external_reference' => (string) $order->id,
                'notification_url' => config('services.mercadopago.webhook_url'),
            ];

            $payment = $client->create($requestBody);

            $order->update([
                'payment_gateway_id' => $payment->id,
                'payment_method_online' => 'credito_online',
                'online_payment_status' => $payment->status,
            ]);

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
                'details' => $e->getApiResponse()->getContent(),
            ];
        } catch (\Exception $e) {
            Log::error("Error creating card payment for order #{$order->id}: " . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Erro interno ao processar pagamento.',
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
        if (!$paymentId) {
            Log::warning('Webhook received without payment ID');
            return false;
        }

        try {
            $client = new PaymentClient();
            $payment = $client->get($paymentId);

            $orderId = $payment->external_reference;
            $order = Order::find($orderId);

            if (!$order) {
                Log::warning("Webhook: Order not found for external_reference: {$orderId}");
                return false;
            }

            $previousStatus = $order->online_payment_status;
            $order->update(['online_payment_status' => $payment->status]);

            Log::info("Webhook: Payment #{$paymentId} for order #{$orderId} — status: {$payment->status}");

            switch ($payment->status) {
                case 'approved':
                    $this->markOrderAsPaidOnline($order, $paymentId);
                    break;

                case 'rejected':
                case 'cancelled':
                    $order->update([
                        'status' => Order::STATUS_REJECTED,
                        'rejected_at' => now(),
                        'rejection_reason' => 'Pagamento ' . ($payment->status === 'rejected' ? 'rejeitado' : 'cancelado'),
                    ]);
                    break;

                case 'pending':
                case 'in_process':
                    // Still waiting, no action needed
                    break;

                case 'refunded':
                    $order->update(['online_payment_status' => Order::ONLINE_PAYMENT_REFUNDED]);
                    break;
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Error processing webhook: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark order as paid online and create payment record.
     */
    protected function markOrderAsPaidOnline(Order $order, $gatewayPaymentId): void
    {
        $order->update([
            'status' => Order::STATUS_PAID_ONLINE,
            'online_payment_status' => Order::ONLINE_PAYMENT_APPROVED,
            'paid_at' => now(),
        ]);

        // Create local payment record
        Payment::create([
            'order_id' => $order->id,
            'method' => $order->payment_method_online ?? 'pix_online',
            'amount' => $order->total_amount,
            'gateway_id' => $gatewayPaymentId,
            'gateway_status' => 'approved',
            'paid_at' => now(),
        ]);
    }

    /**
     * Refund a payment (for rejected orders).
     */
    public function refundPayment(Order $order): array
    {
        if (!$order->payment_gateway_id) {
            return ['success' => false, 'error' => 'Pedido não possui pagamento online.'];
        }

        try {
            $client = new \MercadoPago\Client\Payment\PaymentRefundClient();
            $refund = $client->refund($order->payment_gateway_id);

            $order->update(['online_payment_status' => Order::ONLINE_PAYMENT_REFUNDED]);

            Log::info("Refund processed for order #{$order->id}, gateway payment #{$order->payment_gateway_id}");

            return ['success' => true, 'refund_id' => $refund->id ?? null];
        } catch (\Exception $e) {
            Log::error("Error refunding order #{$order->id}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Erro ao processar estorno.'];
        }
    }

    /**
     * Check payment status directly from gateway.
     */
    public function checkPaymentStatus(Order $order): ?string
    {
        if (!$order->payment_gateway_id) {
            return null;
        }

        try {
            $client = new PaymentClient();
            $payment = $client->get($order->payment_gateway_id);
            return $payment->status;
        } catch (\Exception $e) {
            Log::error("Error checking payment status for order #{$order->id}: " . $e->getMessage());
            return null;
        }
    }
}
