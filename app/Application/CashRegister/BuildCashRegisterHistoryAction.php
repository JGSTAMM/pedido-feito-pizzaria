<?php

namespace App\Application\CashRegister;

use App\Models\CashRegister;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class BuildCashRegisterHistoryAction
{
    public function execute(Request $request): LengthAwarePaginator
    {
        $query = CashRegister::where('status', 'closed')->latest();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereDate('opened_at', '>=', $request->start_date)
                ->whereDate('opened_at', '<=', $request->end_date);
        }

        return $query->paginate(10)->withQueryString()->through(function (CashRegister $register) {
            $orders = Order::where('cash_register_id', $register->id)
                ->whereNotNull('paid_at')
                ->with('payments')
                ->get();

            if ($orders->isEmpty() && $register->opened_at && $register->closed_at) {
                $orders = Order::whereBetween('created_at', [$register->opened_at, $register->closed_at])
                    ->whereNotNull('paid_at')
                    ->with('payments')
                    ->get();
            }

            $methods = [];
            foreach ($orders as $order) {
                foreach ($order->payments as $payment) {
                    $methods[$payment->method] = ($methods[$payment->method] ?? 0) + $payment->amount;
                }
            }

            $cashPayments = (float) ($methods['dinheiro'] ?? 0);
            $totalChange = (float) $orders->sum('change_amount');
            $expectedPhysical = (float) $register->opening_balance + $cashPayments - $totalChange;
            $registerDiff = (float) $register->closing_balance - $expectedPhysical;

            return [
                'id' => $register->id,
                'opened_at' => $register->opened_at?->format('d/m/Y H:i'),
                'closed_at' => $register->closed_at?->format('d/m/Y H:i'),
                'opening_balance' => (float) $register->opening_balance,
                'closing_balance' => (float) $register->closing_balance,
                'notes' => $register->notes,
                'summary' => [
                    'total_sales' => (float) $orders->sum('total_amount'),
                    'order_count' => (int) $orders->count(),
                    'methods' => collect($methods)->map(fn ($val) => (float) $val)->all(),
                    'total_change' => (float) $totalChange,
                    'expected_physical' => (float) $expectedPhysical,
                    'register_diff' => (float) $registerDiff,
                ],
            ];
        });
    }
}
