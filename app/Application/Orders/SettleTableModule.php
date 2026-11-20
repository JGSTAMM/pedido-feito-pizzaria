<?php

namespace App\Application\Orders;

use App\Application\CashRegister\CashRegisterLockService;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Table;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SettleTableModule
{
    public function __construct(
        private readonly CashRegisterLockService $cashRegisterLockService,
    ) {}

    /**
     * Settle active orders for a table with split/single payments, optional service fee and discount.
     * All monetary math is handled strictly in integer CENTS.
     *
     * @param Table $table
     * @param array $payments Array of ['method' => string, 'amount' => int|float]
     * @param User|null $settledBy
     * @param array $options ['amounts_in_cents' => bool, 'service_fee_cents' => int, 'discount_cents' => int, 'discount_supervisor_id' => ?string]
     * @return SettlementResult
     * @throws OrderActionException
     */
    public function execute(
        Table $table,
        array $payments,
        ?User $settledBy = null,
        array $options = []
    ): SettlementResult {
        // Enforce open store cash register invariant (prevents orphan payments / "caixa 2")
        $activeRegister = $this->cashRegisterLockService->requireOpenRegister();

        $amountsInCents = (bool) ($options['amounts_in_cents'] ?? false);
        $serviceFeeCents = (int) ($options['service_fee_cents'] ?? 0);
        $discountCents = (int) ($options['discount_cents'] ?? 0);
        $discountSupervisorId = $options['discount_supervisor_id'] ?? null;

        // Normalize payment pool to integer CENTS
        $paymentPool = [];
        foreach ($payments as $payment) {
            $rawAmount = $payment['amount'] ?? 0;
            $cents = $amountsInCents ? (int) $rawAmount : (int) round(((float) $rawAmount) * 100);
            if ($cents > 0) {
                $paymentPool[] = [
                    'method' => (string) $payment['method'],
                    'amount_cents' => $cents,
                ];
            }
        }

        $statusEvents = [];

        try {
            $result = DB::transaction(function () use (
                $table,
                $paymentPool,
                $activeRegister,
                $serviceFeeCents,
                $discountCents,
                $discountSupervisorId,
                &$statusEvents
            ) {
                /** @var \Illuminate\Database\Eloquent\Collection<Order> $orders */
                $orders = $table->activeOrders()
                    ->lockForUpdate()
                    ->get();

                if ($orders->isEmpty()) {
                    throw new OrderActionException(__('order.payment.no_active_orders'), 404);
                }

                $totalAmountCents = (int) $orders->sum(function (Order $order) {
                    return (int) $order->getRawOriginal('total_amount');
                });

                $totalPaidCents = array_sum(array_column($paymentPool, 'amount_cents'));
                $expectedTotalCents = max(0, $totalAmountCents + $serviceFeeCents - $discountCents);

                if ($totalPaidCents < $expectedTotalCents) {
                    throw new OrderActionException(__('order.payment.insufficient_amount'), 400);
                }

                $pIndex = 0;
                $createdPayments = [];

                foreach ($orders as $index => $order) {
                    $amountToPayForOrder = (int) $order->getRawOriginal('total_amount');

                    // Waterfall payment distribution across orders in integer cents
                    while ($amountToPayForOrder > 0 && $pIndex < count($paymentPool)) {
                        $currentMethod = &$paymentPool[$pIndex];
                        if ($currentMethod['amount_cents'] <= 0) {
                            $pIndex++;
                            continue;
                        }

                        $takeCents = min($currentMethod['amount_cents'], $amountToPayForOrder);

                        // Payment amount mutator expects Reais (multiplies by 100 for integer storage)
                        $payment = Payment::create([
                            'order_id' => $order->id,
                            'method' => $currentMethod['method'],
                            'amount' => $takeCents / 100,
                        ]);
                        $createdPayments[] = $payment;

                        $currentMethod['amount_cents'] -= $takeCents;
                        $amountToPayForOrder -= $takeCents;

                        if ($currentMethod['amount_cents'] <= 0) {
                            $pIndex++;
                        }
                    }

                    // Dump any remaining change/overpayment into the last order
                    if ($index === $orders->count() - 1) {
                        while ($pIndex < count($paymentPool)) {
                            if ($paymentPool[$pIndex]['amount_cents'] > 0) {
                                $payment = Payment::create([
                                    'order_id' => $order->id,
                                    'method' => $paymentPool[$pIndex]['method'],
                                    'amount' => $paymentPool[$pIndex]['amount_cents'] / 100,
                                ]);
                                $createdPayments[] = $payment;
                            }
                            $pIndex++;
                        }
                    }

                    $updateData = [
                        'status' => 'completed',
                        'paid_at' => now(),
                        'cash_register_id' => $activeRegister->id,
                    ];

                    if ($index === 0) {
                        $updateData['service_fee_amount'] = $serviceFeeCents;
                        $updateData['discount_amount'] = $discountCents;
                        $updateData['discount_approved_by'] = $discountSupervisorId;
                    }

                    $previousStatus = $order->status ?? 'ready';
                    $order->update($updateData);

                    $statusEvents[] = [
                        'orderId' => $order->id,
                        'status' => 'completed',
                        'previousStatus' => $previousStatus,
                        'type' => $order->type,
                        'tableId' => $table->id,
                    ];
                }

                $table->update(['status' => 'available']);

                return new SettlementResult(
                    success: true,
                    totalSettledCents: $totalPaidCents,
                    ordersCount: $orders->count(),
                    tableId: $table->id,
                    paymentRecords: $createdPayments,
                );
            });
        } catch (Throwable $exception) {
            if ($exception instanceof OrderActionException) {
                throw $exception;
            }

            throw new OrderActionException('order.payment.error', 500, [], $exception);
        }

        foreach ($statusEvents as $eventData) {
            try {
                event(new OrderStatusUpdated(
                    orderId: $eventData['orderId'],
                    status: $eventData['status'],
                    previousStatus: $eventData['previousStatus'],
                    type: $eventData['type'],
                    tableId: $eventData['tableId'],
                ));
            } catch (Throwable $broadcastEx) {
                Log::warning('Broadcast failed after table settlement: '.$broadcastEx->getMessage());
            }
        }

        return $result;
    }
}
