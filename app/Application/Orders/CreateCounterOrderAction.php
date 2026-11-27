<?php

namespace App\Application\Orders;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Printing\PrintQueueService;
use App\Events\OrderCreated;
use App\Events\OrderCreatedForPrinting;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\User;
use App\Services\PaymentGatewayService;
use App\Services\PizzaPriceService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class CreateCounterOrderAction
{
    public function __construct(
        private readonly PizzaPriceService $pizzaPriceService,
        private readonly CashRegisterLockService $cashRegisterLockService,
        private readonly PrintQueueService $printQueueService,
        private readonly ?PaymentGatewayService $paymentGatewayService = null,
    ) {}

    /**
     * Create a counter/pickup order from POS or Waiter App, either paid immediately or pending cashier payment.
     *
     * @throws OrderActionException
     */
    public function execute(array $validated, User $actor, bool $payNow = true): Order
    {
        $activeRegister = $this->cashRegisterLockService->requireOpenRegister();

        try {
            $order = DB::transaction(function () use ($validated, $actor, $payNow, $activeRegister): Order {
                $totalAmount = 0.0;
                $itemsData = [];

                foreach ($validated['items'] as $item) {
                    $itemsData[] = $this->buildItemData($item, $totalAmount);
                }

                $totalAmount = round($totalAmount, 2);
                $discountCents = (int) ($validated['discount_cents'] ?? 0);
                $discountValue = min($totalAmount, round($discountCents / 100, 2));
                $effectiveDiscountCents = (int) round($discountValue * 100);
                $payableTotal = max(0.0, round($totalAmount - $discountValue, 2));

                $normalizedPayments = [];
                $changeAmount = 0.0;

                if ($payNow) {
                    $normalizedPayments = $this->normalizePayments($validated, $payableTotal);
                    $totalPaid = array_sum(array_column($normalizedPayments, 'amount'));

                    if ($totalPaid < ($payableTotal - 0.01)) {
                        throw new OrderActionException('Valor pago insuficiente para finalizar a venda.', 422);
                    }

                    $changeAmount = max(0.0, round($totalPaid - $payableTotal, 2));
                }

                $customerId = null;
                $customerName = trim((string) $validated['customer_name']);
                $rawPhone = preg_replace('/\D/', '', (string) ($validated['customer_phone'] ?? ''));
                $storedPhone = strlen($rawPhone) >= 10 ? $rawPhone : null;

                if ($storedPhone !== null) {
                    $customer = Customer::firstOrCreate(
                        ['phone' => $storedPhone],
                        ['name' => $customerName]
                    );

                    if ($customer->name !== $customerName) {
                        $customer->update(['name' => $customerName]);
                    }

                    $customerId = $customer->id;
                }

                $order = Order::create([
                    'status' => 'pending',
                    'type' => 'pickup',
                    'total_amount' => $totalAmount,
                    'discount_amount' => $effectiveDiscountCents,
                    'discount_approved_by' => $effectiveDiscountCents > 0 ? ($validated['discount_approved_by'] ?? null) : null,
                    'change_amount' => $changeAmount,
                    'customer_name' => $customerName,
                    'customer_phone' => $storedPhone,
                    'customer_id' => $customerId,
                    'paid_at' => $payNow ? now() : null,
                    'cash_register_id' => $activeRegister->id,
                    'user_id' => $actor->id,
                ]);

                foreach ($itemsData as $data) {
                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $data['product_id'],
                        'pizza_size_id' => $data['pizza_size_id'],
                        'quantity' => $data['quantity'],
                        'unit_price' => $data['unit_price'],
                        'subtotal' => $data['subtotal'],
                        'type' => $data['type'],
                        'description' => $data['description'] ?? null,
                        'notes' => $data['notes'],
                    ]);

                    if (! empty($data['flavor_ids'])) {
                        $fraction = '1/'.count($data['flavor_ids']);
                        foreach ($data['flavor_ids'] as $flavorId) {
                            $orderItem->flavors()->attach($flavorId, [
                                'id' => Str::uuid()->toString(),
                                'fraction' => $fraction,
                            ]);
                        }
                    }
                }

                if ($payNow) {
                    $verifiedGatewayId = null;

                    foreach ($normalizedPayments as $paymentData) {
                        $gatewayId = $paymentData['gateway_id'] ?? null;
                        $gatewayStatus = null;

                        if (! empty($gatewayId)) {
                            if (Payment::withTrashed()->where('gateway_id', $gatewayId)->exists()) {
                                throw new OrderActionException('Este comprovante PIX (gateway_id) já foi utilizado em outro pedido.', 422);
                            }

                            $ownedPixIds = request()?->hasSession()
                                ? (array) request()->session()->get('pos_pix_payment_ids', [])
                                : [];

                            if (! in_array($gatewayId, $ownedPixIds, true)) {
                                throw new OrderActionException('Pagamento PIX do gateway não autorizado nesta sessão de PDV.', 403);
                            }

                            $gatewaySvc = $this->paymentGatewayService ?? app(PaymentGatewayService::class);
                            $verification = $gatewaySvc->verifyApprovedGatewayPayment($gatewayId, (float) $paymentData['amount']);
                            if (! $verification['approved']) {
                                throw new OrderActionException('O pagamento PIX ainda não foi confirmado pelo gateway Mercado Pago.', 422);
                            }

                            $gatewayStatus = 'approved';
                            $verifiedGatewayId = $gatewayId;
                        }

                        Payment::create([
                            'order_id' => $order->id,
                            'method' => $paymentData['method'],
                            'amount' => $paymentData['amount'],
                            'gateway_id' => $gatewayId,
                            'gateway_status' => $gatewayStatus,
                            'paid_at' => now(),
                        ]);
                    }

                    if ($verifiedGatewayId !== null) {
                        $order->update([
                            'payment_gateway_id' => $verifiedGatewayId,
                            'online_payment_status' => Order::ONLINE_PAYMENT_APPROVED,
                        ]);
                    }
                }

                Cache::forget('dashboard_stats');

                return $order;
            });

            $this->dispatchPostCreateSideEffects($order, (bool) ($validated['print_receipt'] ?? false));

            return $order;
        } catch (Throwable $exception) {
            if ($exception instanceof OrderActionException) {
                throw $exception;
            }

            Log::error('Error creating counter order', [
                'exception' => $exception,
                'user_id' => $actor->id,
                'pay_now' => $payNow,
            ]);

            throw new OrderActionException('common.error.unexpected', 500, [], $exception);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function buildItemData(array $item, float &$totalAmount): array
    {
        if ($item['type'] === 'product') {
            $product = Product::findOrFail($item['id']);
            $unitPrice = (float) $product->price;
            $description = $product->name;
            $observation = $item['observation'] ?? null;

            if ($observation && ! empty($product->variations)) {
                foreach ($product->variations as $variation) {
                    if ($variation['name'] === $observation) {
                        $unitPrice = (float) $variation['price'];
                        $description = "{$product->name} ({$variation['name']})";
                        break;
                    }
                }
            }

            $subtotal = $unitPrice * $item['quantity'];
            $totalAmount += $subtotal;

            return [
                'type' => 'product',
                'product_id' => $item['id'],
                'pizza_size_id' => null,
                'flavor_ids' => [],
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'description' => $description,
                'notes' => $observation,
            ];
        }

        if ($item['type'] === 'pizza_custom') {
            $sizeId = $item['size_id'];
            $flavorIds = $item['flavor_ids'] ?? [];
            $borderId = $item['border_id'] ?? null;
            $customerObs = $item['observation'] ?? null;

            $unitPrice = $this->pizzaPriceService->calculateItemPrice($sizeId, $flavorIds);
            $borderName = null;

            if ($borderId) {
                $borderProd = Product::where('id', $borderId)
                    ->where('category', 'Extras')
                    ->where('is_active_pos', true)
                    ->first();
                if ($borderProd) {
                    $unitPrice += (float) $borderProd->price;
                    $borderName = $borderProd->name;
                }
            }

            $size = PizzaSize::find($sizeId);
            $sizeName = $size ? $size->name : 'Pizza';
            $description = "Pizza {$sizeName}";

            if ($borderName && (! $customerObs || ! str_contains(mb_strtolower($customerObs), 'borda:'))) {
                $customerObs = $customerObs ? "Borda: {$borderName} | {$customerObs}" : "Borda: {$borderName}";
            }

            $subtotal = $unitPrice * $item['quantity'];
            $totalAmount += $subtotal;

            return [
                'type' => 'pizza_custom',
                'product_id' => null,
                'pizza_size_id' => $sizeId,
                'flavor_ids' => $flavorIds,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'description' => $description,
                'notes' => $customerObs,
            ];
        }

        $flavor = PizzaFlavor::findOrFail($item['id']);
        $unitPrice = (float) $flavor->base_price;
        $subtotal = $unitPrice * $item['quantity'];
        $totalAmount += $subtotal;

        return [
            'type' => 'pizza_flavor',
            'product_id' => null,
            'pizza_size_id' => null,
            'flavor_ids' => [$item['id']],
            'quantity' => $item['quantity'],
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
            'description' => $flavor->name,
            'notes' => $item['observation'] ?? null,
        ];
    }

    /**
     * @return array<int, array{method: string, amount: float, gateway_id: ?string}>
     */
    private function normalizePayments(array $validated, float $totalAmount): array
    {
        if (! empty($validated['payments'])) {
            return collect($validated['payments'])
                ->map(fn (array $payment) => [
                    'method' => (string) $payment['method'],
                    'amount' => (float) $payment['amount'],
                    'gateway_id' => ! empty($payment['gateway_id']) ? trim((string) $payment['gateway_id']) : null,
                ])
                ->values()
                ->all();
        }

        if (! empty($validated['payment_method'])) {
            return [[
                'method' => (string) $validated['payment_method'],
                'amount' => $totalAmount,
                'gateway_id' => null,
            ]];
        }

        if ($totalAmount <= 0.01) {
            return [];
        }

        throw new OrderActionException('Selecione ao menos uma forma de pagamento.', 422);
    }

    private function dispatchPostCreateSideEffects(Order $order, bool $printReceipt = false): void
    {
        try {
            $this->printQueueService->enqueueKitchenTicket($order);
        } catch (Throwable $queueEx) {
            Log::warning('Failed to enqueue kitchen print job for counter order: '.$queueEx->getMessage());
        }

        if ($printReceipt) {
            try {
                $this->printQueueService->enqueueOrderBill($order);
            } catch (Throwable $billEx) {
                Log::warning('Failed to enqueue cash_register bill print job for counter order: '.$billEx->getMessage());
            }
        }

        try {
            event(new OrderCreated(
                orderId: $order->id,
                status: 'pending',
                type: 'pickup',
                shortCode: $order->short_code ?? '',
                tableId: null,
            ));
        } catch (Throwable $broadcastEx) {
            Log::warning('Broadcast failed after counter order creation: '.$broadcastEx->getMessage());
        }

        try {
            event(new OrderCreatedForPrinting($order->id));
        } catch (Throwable $printException) {
            Log::warning('Automatic thermal printing dispatch failed after counter order creation.', [
                'order_id' => $order->id,
                'error' => $printException->getMessage(),
            ]);
        }
    }
}
