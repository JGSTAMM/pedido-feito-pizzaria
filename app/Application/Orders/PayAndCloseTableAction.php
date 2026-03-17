<?php

namespace App\Application\Orders;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Table;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class PayAndCloseTableAction
{
    public function execute(Table $table, array $payments, User $user): void
    {
        $orders = Order::where('table_id', $table->id)
            ->whereNotIn('status', ['completed', 'paid', 'cancelled'])
            ->get();

        if ($orders->isEmpty()) {
            throw new OrderActionException('order.payment.no_active_orders', 404);
        }

        $totalAmount = (float) $orders->sum('total_amount');
        $totalPaid = (float) collect($payments)->sum('amount');

        if ($totalPaid < $totalAmount - 0.01) {
            throw new OrderActionException('order.payment.insufficient_amount', 400);
        }

        $activeRegister = CashRegister::where('user_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        DB::beginTransaction();

        try {
            $paymentPool = collect($payments)
                ->map(fn (array $payment) => [
                    'method' => $payment['method'],
                    'amount' => (float) $payment['amount'],
                ])
                ->values();

            $poolIndex = 0;

            foreach ($orders as $orderIndex => $order) {
                $orderAmountToPay = (float) $order->total_amount;

                while ($orderAmountToPay > 0.001 && $poolIndex < $paymentPool->count()) {
                    $current = $paymentPool->get($poolIndex);

                    if (($current['amount'] ?? 0) <= 0) {
                        $poolIndex++;
                        continue;
                    }

                    $take = min($current['amount'], $orderAmountToPay);

                    Payment::create([
                        'order_id' => $order->id,
                        'method' => $current['method'],
                        'amount' => $take,
                    ]);

                    $current['amount'] -= $take;
                    $orderAmountToPay -= $take;
                    $paymentPool->put($poolIndex, $current);

                    if ($current['amount'] <= 0.001) {
                        $poolIndex++;
                    }
                }

                if ($orderIndex === $orders->count() - 1) {
                    $this->appendRemainingPaymentToLastOrder($paymentPool, $poolIndex, $order);
                }

                $order->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'cash_register_id' => $activeRegister?->id,
                ]);
            }

            $table->update(['status' => 'available']);
            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            if ($exception instanceof OrderActionException) {
                throw $exception;
            }

            throw new OrderActionException('order.payment.error', 500, [], $exception);
        }
    }

    private function appendRemainingPaymentToLastOrder(Collection $paymentPool, int $poolIndex, Order $order): void
    {
        while ($poolIndex < $paymentPool->count()) {
            $remaining = $paymentPool->get($poolIndex);

            if (($remaining['amount'] ?? 0) > 0.001) {
                Payment::create([
                    'order_id' => $order->id,
                    'method' => $remaining['method'],
                    'amount' => $remaining['amount'],
                ]);
            }

            $poolIndex++;
        }
    }
}
