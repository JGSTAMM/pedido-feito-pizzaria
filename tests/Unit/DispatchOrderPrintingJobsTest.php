<?php

namespace Tests\Unit;

use App\Events\OrderCreatedForPrinting;
use App\Jobs\PrintCustomerReceiptJob;
use App\Jobs\PrintKitchenTicketJob;
use App\Listeners\DispatchOrderPrintingJobs;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class DispatchOrderPrintingJobsTest extends TestCase
{
    public function test_it_dispatches_kitchen_job_when_enabled(): void
    {
        Bus::fake();
        config()->set('printing.auto_print_kitchen', true);
        config()->set('printing.auto_print_receipt', false);

        $listener = new DispatchOrderPrintingJobs();
        $listener->handle(new OrderCreatedForPrinting('order-123'));

        Bus::assertDispatched(PrintKitchenTicketJob::class, function (PrintKitchenTicketJob $job) {
            return $job->orderId === 'order-123';
        });

        Bus::assertNotDispatched(PrintCustomerReceiptJob::class);
    }

    public function test_it_dispatches_receipt_job_when_enabled(): void
    {
        Bus::fake();
        config()->set('printing.auto_print_kitchen', false);
        config()->set('printing.auto_print_receipt', true);

        $listener = new DispatchOrderPrintingJobs();
        $listener->handle(new OrderCreatedForPrinting('order-999'));

        Bus::assertDispatched(PrintCustomerReceiptJob::class, function (PrintCustomerReceiptJob $job) {
            return $job->orderId === 'order-999';
        });

        Bus::assertNotDispatched(PrintKitchenTicketJob::class);
    }
}
