<?php

namespace App\Application\Orders;

use RuntimeException;
use Throwable;

class OrderActionException extends RuntimeException
{
    public function __construct(
        string $translationKey,
        private readonly int $status,
        array $replace = [],
        ?Throwable $previous = null,
        private readonly ?string $reason = null
    ) {
        parent::__construct(__($translationKey, $replace), $status, $previous);
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }
}
