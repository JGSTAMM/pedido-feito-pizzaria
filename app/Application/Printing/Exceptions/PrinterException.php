<?php

namespace App\Application\Printing\Exceptions;

use RuntimeException;
use Throwable;

abstract class PrinterException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly string $failureType,
        private readonly string $errorCode,
        private readonly bool $retryable,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function failureType(): string
    {
        return $this->failureType;
    }

    public function errorCode(): string
    {
        return $this->errorCode;
    }

    public function retryable(): bool
    {
        return $this->retryable;
    }
}
