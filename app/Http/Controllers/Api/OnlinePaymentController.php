<?php

namespace App\Http\Controllers\Api;

use App\Application\Checkout\ProcessOnlineCheckoutAction;
use App\Application\Checkout\ProcessPaymentWebhookAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OnlinePaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGatewayService $paymentGatewayService,
        private readonly ProcessOnlineCheckoutAction $processOnlineCheckoutAction,
        private readonly ProcessPaymentWebhookAction $processPaymentWebhookAction,
    ) {
    }

    /**
     * POST /api/online-orders
     * 
     * Creates an order from the digital menu and generates a payment.
     * The order stays in "awaiting_payment" until the gateway confirms.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name'   => 'required|string|max:255',
            'customer_phone'  => 'required|string|max:20',
            'payer_email'     => 'required|email',
            'type'            => 'required|in:pickup,delivery,dine_in',
            'payment_method'  => 'required|in:pix,credit_card',
            'items'           => 'required|array|min:1',
            'items.*.type'    => 'required|in:product,pizza',
            'items.*.product_id'   => 'required_if:items.*.type,product|nullable|string',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.pizza_size_id' => 'required_if:items.*.type,pizza|nullable|string',
            'items.*.flavor_ids'   => 'required_if:items.*.type,pizza|nullable|array',
            'items.*.notes'        => 'nullable|string|max:500',
            // Delivery — either a registered neighborhood OR a custom one typed by the customer
            'neighborhood_id'      => 'nullable|string|exists:neighborhoods,id',
            'custom_neighborhood'  => 'nullable|string|max:100',
            'delivery_address'     => 'required_if:type,delivery|nullable|string|max:500',
            'delivery_complement'  => 'nullable|string|max:255',
            // Dine-in fields
            'table_id'    => 'required_if:type,dine_in|nullable|string|exists:tables,id',
            'table_code'  => 'required_if:type,dine_in|nullable|string|max:50',
            // Card fields
            'card_token'   => 'required_if:payment_method,credit_card|nullable|string',
            'installments' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Cross-field validation: delivery requires at least one of neighborhood_id or custom_neighborhood
        if (($validated['type'] ?? null) === 'delivery'
            && empty($validated['neighborhood_id'])
            && empty(trim($validated['custom_neighborhood'] ?? ''))
        ) {
            return response()->json([
                'success' => false,
                'errors'  => ['neighborhood_id' => [__('digital_menu.checkout.errors.neighborhood_required')]],
            ], 422);
        }

        $result = $this->processOnlineCheckoutAction->execute($validated);

        return response()->json($result['payload'], $result['status'])
            ->cookie('customer_phone', $validated['customer_phone'], 60 * 24 * 365);
    }

    /**
     * POST /api/payments/webhook
     * 
     * Receives payment notifications from Mercado Pago.
     */
    public function webhook(Request $request)
    {
        Log::info('Mercado Pago webhook received', $request->all());

        $result = $this->processPaymentWebhookAction->execute($request);

        return response()->json($result['payload'], $result['status']);
    }

    /**
     * GET /api/orders/{id}/payment-status
     * 
     * Allows the customer to poll for payment confirmation.
     */
    public function paymentStatus(int $orderId)
    {
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'error' => __('digital_menu.errors.order_not_found'),
            ], 404);
        }

        // Check directly with gateway if still pending
        if ($order->status === Order::STATUS_AWAITING_PAYMENT && $order->payment_gateway_id) {
            $gatewayStatus = $this->paymentGatewayService->checkPaymentStatus($order);

            if ($gatewayStatus === 'approved' && $order->online_payment_status !== 'approved') {
                // Webhook may have been delayed — process it now
                $this->paymentGatewayService->handleWebhook([
                    'type' => 'payment',
                    'data' => ['id' => $order->payment_gateway_id],
                ]);
                $order->refresh();
            }
        }

        return response()->json([
            'success' => true,
            'message' => __('digital_menu.checkout.payment_status_loaded'),
            'order_id' => $order->id,
            'order_code' => $order->short_code,
            'status' => $order->status,
            'payment_status' => $order->online_payment_status,
            'is_paid' => $order->isPaidOnline(),
            'is_accepted' => $order->status === Order::STATUS_ACCEPTED,
            'pix_qr_code' => $order->pix_qr_code,
            'pix_qr_code_base64' => $order->pix_qr_code_base64,
        ]);
    }
}
