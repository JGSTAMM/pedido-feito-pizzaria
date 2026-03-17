<?php

namespace App\Application\CashRegister;

use App\Models\CashRegister;
use App\Models\Order;

class EnsureNoPendingOrdersForCloseAction
{
    public function execute(CashRegister $register): int
    {
        return Order::where(function ($query) use ($register) {
                $query->where('cash_register_id', $register->id)
                    ->orWhere('created_at', '>=', $register->opened_at);
            })
            ->where(function ($query) {
                $query->whereNotIn('status', ['completed', 'rejected', 'cancelled'])
                    ->orWhereNull('paid_at');
            })
            ->count();
    }
}
