<?php

namespace App\Listeners;

use App\Events\OrderCreatedForPrinting;
use App\Jobs\PrintCustomerReceiptJob;
use App\Jobs\PrintKitchenTicketJob;

class DispatchOrderPrintingJobs
{
    public function handle(OrderCreatedForPrinting $event): void
    {
        if (config('printing.auto_print_kitchen')) {
            PrintKitchenTicketJob::dispatch($event->orderId)->onQueue('printing');
        }

        if (config('printing.auto_print_receipt')) {
            PrintCustomerReceiptJob::dispatch($event->orderId)->onQueue('printing');
        }
    }
}
