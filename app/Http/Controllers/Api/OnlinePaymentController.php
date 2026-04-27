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
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'payer_email' => 'nullable|email',
            'type' => 'required|in:pickup,delivery,dine_in',
            'payment_method' => 'required|in:pix,credit_card,cash',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:product,pizza',
            'items.*.product_id' => 'required_if:items.*.type,product|nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.pizza_size_id' => 'required_if:items.*.type,pizza|nullable|string',
            'items.*.flavor_ids' => 'required_if:items.*.type,pizza|nullable|array',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.description' => 'nullable|string|max:500',
            // Delivery — either a registered neighborhood OR a custom one typed by the customer
            'neighborhood_id' => 'nullable|string|exists:neighborhoods,id',
            'custom_neighborhood' => 'nullable|string|max:100',
            'delivery_address' => 'required_if:type,delivery|nullable|string|max:500',
            'delivery_complement' => 'nullable|string|max:255',
            // Dine-in fields
            'table_id' => 'required_if:type,dine_in|nullable|string|exists:tables,id',
            'table_code' => 'required_if:type,dine_in|nullable|string|max:50',
            // Card fields (only meaningful for credit_card method)
            'card_token' => 'nullable|string',
            'installments' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Cross-field validation: delivery requires at least one of neighborhood_id or custom_neighborhood
        if (
            ($validated['type'] ?? null) === 'delivery'
            && empty($validated['neighborhood_id'])
            && empty(trim($validated['custom_neighborhood'] ?? ''))
        ) {
            return response()->json([
                'success' => false,
                'errors' => ['neighborhood_id' => [__('digital_menu.checkout.errors.neighborhood_required')]],
            ], 422);
        }

        $result = $this->processOnlineCheckoutAction->execute($validated);

        // Ownership validation: Store order ID in session for polling security
        if ($result['status'] === 201 && isset($result['payload']['order_id'])) {
            session()->put('current_order_id', $result['payload']['order_id']);
        }

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
    public function paymentStatus(string $orderId)
    {
        // 1. Ownership Validation (Security: Prevent IDOR)
        // For guest checkouts, we verify against the session ID stored during store()
        $isAuthorized = (session()->get('current_order_id') === $orderId);

        if (!$isAuthorized) {
            Log::warning("Unauthorized order status access attempt (IDOR)", [
                'requested_order_id' => $orderId,
                'session_order_id' => session()->get('current_order_id'),
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent()
            ]);

            return response()->json([
                'success' => false,
                'error' => __('digital_menu.errors.unauthorized_order_access'),
            ], 403);
        }

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'error' => __('digital_menu.errors.order_not_found'),
            ], 404);
        }

        // Check directly with gateway if still pending
        if ($order->status === Order::STATUS_AWAITING_PAYMENT && $order->payment_gateway_id) {
            try {
                $gatewayStatus = $this->paymentGatewayService->checkPaymentStatus($order);

                if (
                    $gatewayStatus && 
                    !in_array($gatewayStatus, ['pending', 'in_process']) && 
                    $gatewayStatus !== $order->online_payment_status
                ) {
                    // Webhook may have been delayed — process ANY conclusive status now
                    $this->paymentGatewayService->handleWebhook([
                        'type' => 'payment',
                        'data' => ['id' => $order->payment_gateway_id],
                    ]);
                    $order->refresh();
                }
            } catch (\Throwable $e) {
                Log::error('Gateway polling failed: ' . $e->getMessage(), [
                    'order_id' => $order->id,
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'status' => $order->status,
                    'gateway_error' => true,
                    'message' => 'Payment gateway unreachable.',
                ]);
            }
        }

        return response()->json([
            'success'               => true,
            'message'               => __('digital_menu.checkout.payment_status_loaded'),
            'order_id'              => $order->id,
            'order_code'            => $order->short_code,
            'status'                => $order->status,
            'payment_status'        => $order->online_payment_status,
            'payment_method_online' => $order->payment_method_online,
            'type'                  => $order->type,
            'customer_name'         => $order->customer_name,
            'is_paid'               => $order->isPaidOnline(),
            'is_accepted'           => $order->status === Order::STATUS_ACCEPTED,
            'pix_qr_code'           => $order->pix_qr_code,
            'pix_qr_code_base64'    => $order->pix_qr_code_base64,
        ]);
    }
}
