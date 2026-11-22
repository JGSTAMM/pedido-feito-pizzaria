<?php

namespace App\Application\CashRegister;

use App\Models\CashRegister;
use App\Models\Order;

class BuildCashRegisterSummaryAction
{
    public function execute(?CashRegister $register): array
    {
        if (! $register) {
            return [
                'opening_balance' => 0.0,
                'total_sales' => 0.0,
                'order_count' => 0,
                'methods' => [],
                'total_change' => 0.0,
                'total_in_drawer' => 0.0,
            ];
        }

        $orders = Order::where('cash_register_id', $register->id)
            ->whereNotNull('paid_at')
            ->with('payments')
            ->get();

        if ($orders->isEmpty()) {
            $orders = Order::where('created_at', '>=', $register->opened_at)
                ->whereNotNull('paid_at')
                ->with('payments')
                ->get();
        }

        $methods = [];
        $physicalChangeTotal = 0.0;
        foreach ($orders as $order) {
            $orderCashPaid = 0.0;
            foreach ($order->payments as $payment) {
                $methods[$payment->method] = ($methods[$payment->method] ?? 0) + $payment->amount;
                if ($payment->method === 'dinheiro') {
                    $orderCashPaid += (float) $payment->amount;
                }
            }
            $recordedChange = (float) ($order->change_amount ?? 0);
            $physicalChangeTotal += min($recordedChange, $orderCashPaid);
        }

        $cashPayments = (float) ($methods['dinheiro'] ?? 0);
        $totalChange = round($physicalChangeTotal, 2);

        $netSalesCents = $orders->sum(function (Order $order) {
            return (int) $order->getRawOriginal('total_amount')
                + (int) ($order->service_fee_amount ?? 0)
                - (int) ($order->discount_amount ?? 0);
        });

        return [
            'opening_balance' => (float) $register->opening_balance,
            'total_sales' => max(0.0, round($netSalesCents / 100, 2)),
            'order_count' => $orders->count(),
            'methods' => $methods,
            'total_change' => $totalChange,
            'total_in_drawer' => (float) $register->opening_balance + $cashPayments - $totalChange,
        ];
    }
}
