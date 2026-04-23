<?php

namespace App\Application\Checkout;

use App\Models\Neighborhood;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
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
            [$tableId, $tableError] = $this->resolveDineInTable($validated);

            if ($tableError !== null) {
                return [
                    'status' => 422,
                    'payload' => [
                        'success' => false,
                        'errors' => [
                            'table_code' => [$tableError],
                        ],
                    ],
                ];
            }

            DB::beginTransaction();

            $deliveryFee = $this->resolveDeliveryFee($validated);
            $orderType   = ($validated['type'] ?? null) === 'dine_in' ? 'salon' : $validated['type'];

            $isCash = ($validated['payment_method'] ?? '') === 'cash';

            // Use forceFill for fields intentionally excluded from $fillable (status, total_amount)
            $order = new Order();
            $order->forceFill([
                'status'               => $isCash ? Order::STATUS_PENDING : Order::STATUS_AWAITING_PAYMENT,
                'type'                 => $orderType,
                'table_id'             => $tableId,
                'customer_name'        => $validated['customer_name'],
                'customer_phone'       => $validated['customer_phone'],
                'neighborhood_id'      => $validated['neighborhood_id'] ?? null,
                'delivery_address'     => $validated['delivery_address'] ?? null,
                'delivery_complement'  => $validated['delivery_complement'] ?? null,
                'delivery_fee'         => $deliveryFee,
                'total_amount'         => 0,
            ]);
            $order->save();

            $itemsTotal = $this->createOrderItems($order, $validated['items']);
            $total = $itemsTotal + $deliveryFee;
            $order->forceFill(['total_amount' => $total])->save();

            // Start payment BEFORE committing so we can rollback on gateway failure
            $paymentResult = $this->startPayment($order, $validated);

            if (!$paymentResult['success']) {
                DB::rollBack();

                return [
                    'status'  => 400,
                    'payload' => [
                        'success' => false,
                        'error'   => $paymentResult['error'] ?? __('digital_menu.checkout.payment_creation_failed'),
                    ],
                ];
            }

            DB::commit();

            return [
                'status'  => 201,
                'payload' => [
                    'success'  => true,
                    'message'  => __('digital_menu.checkout.order_created'),
                    'order_id' => $order->id,
                    'payment'  => $paymentResult['data'],
                ],
            ];
        } catch (Throwable $exception) {
            DB::rollBack();
            Log::error('Error creating online order', [
                'message'   => $exception->getMessage(),
                'exception' => $exception,
            ]);

            return [
                'status'  => 500,
                'payload' => [
                    'success' => false,
                    'error'   => __('digital_menu.errors.checkout_process_failed'),
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
            'description' => $item['description'] ?? null,
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
            'description' => $item['description'] ?? null,
        ]);

        return $subtotal;
    }

    private function startPayment(Order $order, array $validated): array
    {
        if ($validated['payment_method'] === 'cash') {
            return [
                'success' => true,
                'data' => [
                    'id' => null,
                    'status' => 'pending_cash',
                ],
            ];
        }

        if ($validated['payment_method'] === 'pix') {
            return $this->paymentGatewayService->createPixPayment($order, $validated['payer_email'] ?? 'pagamento@pedidofeito.com');
        }

        // Credit card — card_token is mandatory
        if (empty($validated['card_token'])) {
            return [
                'success' => false,
                'error' => 'Token do cartão é obrigatório para pagamento com cartão de crédito.',
            ];
        }

        return $this->paymentGatewayService->createCardPayment(
            $order,
            $validated['card_token'],
            $validated['payer_email'] ?? 'pagamento@pedidofeito.com',
            1, // Always 1 installment for food orders
        );
    }

    private function resolveDineInTable(array $validated): array
    {
        if (($validated['type'] ?? null) !== 'dine_in') {
            return [null, null];
        }

        if (!empty($validated['table_id'])) {
            $table = Table::find($validated['table_id']);

            if ($table) {
                return [$table->id, null];
            }
        }

        $tableCode = trim((string) ($validated['table_code'] ?? ''));

        if ($tableCode === '') {
            return [null, __('digital_menu.checkout.errors.table_code_required')];
        }

        $table = Table::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($tableCode)])
            ->first();

        if (!$table) {
            return [null, __('digital_menu.checkout.errors.table_not_found')];
        }

        return [$table->id, null];
    }
}
