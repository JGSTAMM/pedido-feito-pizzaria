<?php

namespace App\Jobs;

use App\Application\Printing\Exceptions\PrinterHardwareException;
use App\Application\Printing\Exceptions\PrinterNetworkException;
use App\Application\Printing\PrinterAlertService;
use App\Application\Printing\PrintingTelemetryService;
use App\Models\Order;
use App\Services\PrintService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class PrintCustomerReceiptJob implements ShouldQueue, ShouldBeUnique
{
    use InteractsWithQueue;
    use Queueable;

    public int $tries;

    public int $timeout;

    public int $uniqueFor;

    public function __construct(
        public readonly string $orderId,
    ) {
        $this->tries = (int) config('printing.retries.max_attempts', 3);
        $this->timeout = (int) config('printing.retries.job_timeout_seconds', 30);
        $this->uniqueFor = (int) config('printing.idempotency.job_unique_for_seconds', 3600);
    }

    public function backoff(): array
    {
        return config('printing.retries.network_backoff_seconds', [10, 30, 60]);
    }

    public function uniqueId(): string
    {
        return "print:receipt:{$this->orderId}";
    }

    public function handle(
        PrintService $printService,
        PrintingTelemetryService $telemetry,
        PrinterAlertService $alertService,
    ): void
    {
        $idempotencyKey = "printing:receipt:completed:{$this->orderId}";

        if (Cache::has($idempotencyKey)) {
            Log::info('Skipping duplicated receipt print job for order.', [
                'order_id' => $this->orderId,
            ]);

            return;
        }

        $order = Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'table', 'payments'])
            ->find($this->orderId);

        if (!$order) {
            Log::warning('Order not found for receipt print job.', [
                'order_id' => $this->orderId,
            ]);

            return;
        }

        try {
            $printed = $printService->printCustomerReceipt($order);

            if (!$printed) {
                return;
            }

            $telemetry->recordSuccess($order, 'cashier');
        } catch (PrinterNetworkException $exception) {
            $telemetry->recordFailure($order, 'cashier', $exception->failureType(), $exception->getMessage());
            throw $exception;
        } catch (PrinterHardwareException $exception) {
            $telemetry->recordFailure($order, 'cashier', $exception->failureType(), $exception->getMessage());
            $alertService->raiseHardwareAlert(
                $order,
                'cashier',
                $exception->errorCode(),
                $exception->getMessage(),
            );

            if ($this->job !== null) {
                $this->fail($exception);
            }

            return;
        }

        $ttlSeconds = (int) config('printing.idempotency.completion_ttl_seconds', 86400);
        Cache::put($idempotencyKey, true, now()->addSeconds($ttlSeconds));
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Receipt print job failed.', [
            'order_id' => $this->orderId,
            'exception' => $exception->getMessage(),
        ]);
    }
}
