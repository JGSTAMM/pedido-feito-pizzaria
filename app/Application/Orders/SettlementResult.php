<?php

namespace App\Application\Orders;

readonly class SettlementResult
{
    public function __construct(
        public bool $success,
        public int $totalSettledCents,
        public int $ordersCount,
        public string $tableId,
        public array $paymentRecords = [],
    ) {}
}
