<?php

namespace App\Application\CashRegister;

use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;

class CashRegisterLockService
{
    public function __construct(
        private readonly EnsureNoPendingOrdersForCloseAction $ensureNoPendingOrdersForCloseAction,
    ) {
    }

    public function requireOpenRegister(): CashRegister
    {
        $register = CashRegister::where('status', 'open')
            ->latest()
            ->first();

        if (!$register) {
            throw new OrderActionException('order.create.cash_register_closed', 403);
        }

        return $register;
    }

    public function assertCanCloseRegister(CashRegister $register): void
    {
        $pendingOrdersCount = $this->ensureNoPendingOrdersForCloseAction->execute($register);

        if ($pendingOrdersCount > 0) {
            throw new OrderActionException(
                'order.cash_register.close_blocked_pending',
                422,
                ['count' => $pendingOrdersCount]
            );
        }
    }
}
