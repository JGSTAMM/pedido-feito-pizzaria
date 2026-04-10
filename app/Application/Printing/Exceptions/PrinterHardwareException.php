<?php

namespace App\Application\Printing\Exceptions;

use Throwable;

class PrinterHardwareException extends PrinterException
{
    public function __construct(
        string $message,
        string $errorCode = 'HARDWARE_ERROR',
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 'hardware', $errorCode, false, $previous);
    }

    public static function noPaper(string $message, ?Throwable $previous = null): self
    {
        return new self($message, 'NO_PAPER', $previous);
    }
}
