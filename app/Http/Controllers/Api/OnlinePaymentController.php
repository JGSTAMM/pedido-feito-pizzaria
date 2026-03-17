<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Neighborhood;
use App\Services\PaymentGatewayService;
use App\Services\PizzaPriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class OnlinePaymentController extends Controller
{
    public function __construct(private readonly PaymentGatewayService $paymentGatewayService)
    {
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
            'payer_email' => 'required|email',
            'type' => 'required|in:pickup,delivery',
            'payment_method' => 'required|in:pix,credit_card',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:product,pizza',
            'items.*.product_id' => 'required_if:items.*.type,product|nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.pizza_size_id' => 'required_if:items.*.type,pizza|nullable|string',
            'items.*.flavor_ids' => 'required_if:items.*.type,pizza|nullable|array',
            'items.*.notes' => 'nullable|string|max:500',
            // Delivery fields
            'neighborhood_id' => 'required_if:type,delivery|nullable|string|exists:neighborhoods,id',
            'delivery_address' => 'required_if:type,delivery|nullable|string|max:500',
            'delivery_complement' => 'nullable|string|max:255',
            // Card fields
            'card_token' => 'required_if:payment_method,credit_card|nullable|string',
            'installments' => 'nullable|integer|min:1|max:12',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Calculate delivery fee
            $deliveryFee = 0;
            if ($request->type === 'delivery' && $request->neighborhood_id) {
                $neighborhood = Neighborhood::find($request->neighborhood_id);
                $deliveryFee = $neighborhood ? (float) $neighborhood->delivery_fee : 0;
            }

            // Create order
            $order = Order::create([
                'status' => Order::STATUS_AWAITING_PAYMENT,
                'type' => $request->type,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'neighborhood_id' => $request->neighborhood_id,
                'delivery_address' => $request->delivery_address,
                'delivery_complement' => $request->delivery_complement,
                'delivery_fee' => $deliveryFee,
                'total_amount' => 0, // Will be calculated after items
            ]);

            // Create order items and calculate total
            $total = 0;
            $pizzaPriceService = new PizzaPriceService();

            foreach ($request->items as $item) {
                if ($item['type'] === 'pizza') {
                    $price = $pizzaPriceService->calculateItemPrice(
                        $item['pizza_size_id'],
                        $item['flavor_ids']
                    );
                    $subtotal = $price * $item['quantity'];

                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'pizza_size_id' => $item['pizza_size_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $price,
                        'subtotal' => $subtotal,
                        'type' => 'pizza',
                        'notes' => $item['notes'] ?? null,
                    ]);

                    // Attach flavors
                    $count = count($item['flavor_ids']);
                    $fraction = "1/{$count}";
                    $attachData = [];
                    foreach ($item['flavor_ids'] as $fid) {
                        $attachData[$fid] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'fraction' => $fraction
                        ];
                    }
                    $orderItem->flavors()->attach($attachData);

                    $total += $subtotal;
                } else {
                    $product = \App\Models\Product::find($item['product_id']);
                    if (!$product) continue;

                    $subtotal = (float) $product->price * $item['quantity'];

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                        'subtotal' => $subtotal,
                        'type' => 'product',
                        'notes' => $item['notes'] ?? null,
                    ]);

                    $total += $subtotal;
                }
            }

            // Add delivery fee to total
            $total += $deliveryFee;
            $order->update(['total_amount' => $total]);

            DB::commit();

            // Process payment
            $gateway = new PaymentGatewayService();

            if ($request->payment_method === 'pix') {
                $result = $gateway->createPixPayment($order, $request->payer_email);
            } else {
                $result = $gateway->createCardPayment(
                    $order,
                    $request->card_token,
                    $request->payer_email,
                    $request->installments ?? 1
                );
            }

            if (!$result['success']) {
                // Payment creation failed — mark order for cleanup
                $order->update(['status' => Order::STATUS_REJECTED, 'rejection_reason' => $result['error'] ?? 'Falha no pagamento']);
                return response()->json([
                    'success' => false,
                    'error' => $result['error'] ?? 'Falha ao criar pagamento.',
                    'order_id' => $order->id,
                ], 400);
            }

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'payment' => $result['data'],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error creating online order: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => 'Erro ao criar pedido. Tente novamente.',
            ], 500);
        }
    }

    /**
     * POST /api/payments/webhook
     * 
     * Receives payment notifications from Mercado Pago.
     */
    public function webhook(Request $request)
    {
        Log::info('Mercado Pago webhook received', $request->all());

        if (!$this->paymentGatewayService->validateWebhookSignature($request)) {
            return response()->json([
                'received' => false,
                'message' => __('webhook.invalid_signature'),
            ], 403);
        }

        $notificationId = $this->paymentGatewayService->extractNotificationId($request);

        if (!$notificationId) {
            return response()->json([
                'received' => false,
                'message' => __('webhook.missing_notification_id'),
            ], 400);
        }

        $cacheKey = "mercadopago:webhook:{$notificationId}";
        if (!Cache::add($cacheKey, now()->toISOString(), now()->addDay())) {
            return response()->json([
                'received' => true,
                'duplicate' => true,
                'message' => __('webhook.duplicate_notification'),
            ]);
        }

        $success = $this->paymentGatewayService->handleWebhook($request->all());

        if (!$success) {
            Cache::forget($cacheKey);
            return response()->json([
                'received' => false,
                'message' => __('webhook.processing_failed'),
            ], 400);
        }

        return response()->json(['received' => true]);
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
            return response()->json(['error' => 'Pedido não encontrado.'], 404);
        }

        // Check directly with gateway if still pending
        if ($order->status === Order::STATUS_AWAITING_PAYMENT && $order->payment_gateway_id) {
            $gateway = new PaymentGatewayService();
            $gatewayStatus = $gateway->checkPaymentStatus($order);

            if ($gatewayStatus === 'approved' && $order->online_payment_status !== 'approved') {
                // Webhook may have been delayed — process it now
                $gateway->handleWebhook([
                    'type' => 'payment',
                    'data' => ['id' => $order->payment_gateway_id],
                ]);
                $order->refresh();
            }
        }

        return response()->json([
            'order_id' => $order->id,
            'status' => $order->status,
            'payment_status' => $order->online_payment_status,
            'is_paid' => $order->isPaidOnline(),
            'is_accepted' => $order->status === Order::STATUS_ACCEPTED,
        ]);
    }
}
