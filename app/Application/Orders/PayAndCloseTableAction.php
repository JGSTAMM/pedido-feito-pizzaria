<?php

namespace App\Application\Orders;

use App\Models\Table;
use App\Models\User;

class PayAndCloseTableAction
{
    public function __construct(
        private readonly SettleTableModule $settleTableModule,
    ) {}

    /**
     * Legacy adapter delegating to SettleTableModule.
     * Note: API receives payments with amounts as floats/reais (amounts_in_cents => false).
     */
    public function execute(Table $table, array $payments, User $user): void
    {
        $this->settleTableModule->execute(
            table: $table,
            payments: $payments,
            settledBy: $user,
            options: ['amounts_in_cents' => false]
        );
    }
}
