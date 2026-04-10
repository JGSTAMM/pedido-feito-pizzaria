<?php

namespace App\Application\Printing\Exceptions;

use Throwable;

class PrinterNetworkException extends PrinterException
{
    public function __construct(
        string $message,
        string $errorCode = 'NETWORK_ERROR',
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 'network', $errorCode, true, $previous);
    }
}
