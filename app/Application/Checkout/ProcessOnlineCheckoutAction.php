<?php

namespace App\Application\Checkout;

use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\PaymentGatewayService;
use App\Services\PizzaPriceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ProcessOnlineCheckoutAction
{
    public function __construct(
        private readonly PaymentGatewayService $paymentGatewayService,
        private readonly PizzaPriceService $pizzaPriceService,
    ) {
    }

    public function execute(array $validated): array
    {
        try {
            DB::beginTransaction();

            $deliveryFee = $this->resolveDeliveryFee($validated);

            $order = Order::create([
                'status' => Order::STATUS_AWAITING_PAYMENT,
                'type' => $validated['type'],
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'neighborhood_id' => $validated['neighborhood_id'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'delivery_complement' => $validated['delivery_complement'] ?? null,
                'delivery_fee' => $deliveryFee,
                'total_amount' => 0,
            ]);

            $itemsTotal = $this->createOrderItems($order, $validated['items']);
            $total = $itemsTotal + $deliveryFee;
            $order->update(['total_amount' => $total]);

            DB::commit();

            $paymentResult = $this->startPayment($order, $validated);
            if (!$paymentResult['success']) {
                $order->update([
                    'status' => Order::STATUS_REJECTED,
                    'rejection_reason' => $paymentResult['error'] ?? __('digital_menu.checkout.payment_creation_failed'),
                ]);

                return [
                    'status' => 400,
                    'payload' => [
                        'success' => false,
                        'error' => $paymentResult['error'] ?? __('digital_menu.checkout.payment_creation_failed'),
                        'order_id' => $order->id,
                    ],
                ];
            }

            return [
                'status' => 201,
                'payload' => [
                    'success' => true,
                    'message' => __('digital_menu.checkout.order_created'),
                    'order_id' => $order->id,
                    'payment' => $paymentResult['data'],
                ],
            ];
        } catch (Throwable $exception) {
            DB::rollBack();
            Log::error('Error creating online order', [
                'message' => $exception->getMessage(),
                'exception' => $exception,
            ]);

            return [
                'status' => 500,
                'payload' => [
                    'success' => false,
                    'error' => __('digital_menu.errors.checkout_process_failed'),
                ],
            ];
        }
    }

    private function resolveDeliveryFee(array $validated): float
    {
        if (($validated['type'] ?? null) !== 'delivery' || empty($validated['neighborhood_id'])) {
            return 0;
        }

        $neighborhood = Neighborhood::find($validated['neighborhood_id']);

        return $neighborhood ? (float) $neighborhood->delivery_fee : 0;
    }

    private function createOrderItems(Order $order, array $items): float
    {
        $total = 0;

        foreach ($items as $item) {
            if ($item['type'] === 'pizza') {
                $total += $this->createPizzaItem($order, $item);
                continue;
            }

            $total += $this->createProductItem($order, $item);
        }

        return $total;
    }

    private function createPizzaItem(Order $order, array $item): float
    {
        $price = $this->pizzaPriceService->calculateItemPrice(
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

        $count = count($item['flavor_ids']);
        $fraction = "1/{$count}";
        $attachData = [];

        foreach ($item['flavor_ids'] as $flavorId) {
            $attachData[$flavorId] = [
                'id' => Str::uuid()->toString(),
                'fraction' => $fraction,
            ];
        }

        $orderItem->flavors()->attach($attachData);

        return $subtotal;
    }

    private function createProductItem(Order $order, array $item): float
    {
        $product = Product::find($item['product_id']);
        if (!$product) {
            return 0;
        }

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

        return $subtotal;
    }

    private function startPayment(Order $order, array $validated): array
    {
        if ($validated['payment_method'] === 'pix') {
            return $this->paymentGatewayService->createPixPayment($order, $validated['payer_email']);
        }

        return $this->paymentGatewayService->createCardPayment(
            $order,
            $validated['card_token'],
            $validated['payer_email'],
            $validated['installments'] ?? 1,
        );
    }
}
