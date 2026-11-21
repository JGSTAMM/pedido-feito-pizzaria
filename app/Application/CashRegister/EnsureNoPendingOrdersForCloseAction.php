<?php

namespace App\Application\CashRegister;

use App\Models\CashRegister;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class EnsureNoPendingOrdersForCloseAction
{
    public function blockingOrdersQuery(CashRegister $register): Builder
    {
        return Order::query()
            ->where(function ($query) use ($register) {
                $query->where('cash_register_id', $register->id)
                    ->orWhere('created_at', '>=', $register->opened_at);
            })
            ->whereNotIn('status', [
                Order::STATUS_CANCELLED,
                Order::STATUS_REJECTED,
                Order::STATUS_AWAITING_PAYMENT,
            ])
            ->where(function ($query) {
                $query->whereNull('paid_at')
                    ->orWhereNotIn('status', [
                        Order::STATUS_COMPLETED,
                        Order::STATUS_DELIVERED,
                        Order::STATUS_PAID,
                    ]);
            });
    }

    public function execute(CashRegister $register): int
    {
        return $this->blockingOrdersQuery($register)->count();
    }

    public function getBlockingOrders(CashRegister $register): Collection
    {
        return $this->blockingOrdersQuery($register)
            ->with(['table'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'short_code' => $order->short_code,
                    'customer_name' => $order->customer_name,
                    'table_name' => $order->table ? ($order->table->name ?? "Mesa {$order->table->number}") : null,
                    'type' => $order->type,
                    'status' => $order->status,
                    'is_paid' => ! is_null($order->paid_at),
                    'total_amount' => (float) $order->total_amount,
                    'created_at' => $order->created_at?->format('H:i'),
                ];
            });
    }
}
