<?php

namespace App\Application\Printing;

use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrintingTelemetryService
{
    public function recordSuccess(Order $order, string $printerType): void
    {
        [$tenantKey, $tenantName] = $this->resolveTenant();
        $date = now()->toDateString();

        $this->ensureMetricsRow($date, $tenantKey, $tenantName, $printerType);

        DB::table('print_metrics')
            ->where('metric_date', $date)
            ->where('tenant_key', $tenantKey)
            ->where('printer_type', $printerType)
            ->update([
                'total_attempts' => DB::raw('total_attempts + 1'),
                'success_count' => DB::raw('success_count + 1'),
                'updated_at' => now(),
            ]);

        Log::info('Print telemetry success.', [
            'tenant_key' => $tenantKey,
            'tenant_name' => $tenantName,
            'printer_type' => $printerType,
            'order_id' => $order->id,
        ]);
    }

    public function recordFailure(
        Order $order,
        string $printerType,
        string $failureType,
        string $message,
    ): void {
        [$tenantKey, $tenantName] = $this->resolveTenant();
        $date = now()->toDateString();

        $this->ensureMetricsRow($date, $tenantKey, $tenantName, $printerType);

        $networkIncrement = $failureType === 'network' ? 1 : 0;
        $hardwareIncrement = $failureType === 'hardware' ? 1 : 0;

        DB::table('print_metrics')
            ->where('metric_date', $date)
            ->where('tenant_key', $tenantKey)
            ->where('printer_type', $printerType)
            ->update([
                'total_attempts' => DB::raw('total_attempts + 1'),
                'failure_count' => DB::raw('failure_count + 1'),
                'network_failure_count' => DB::raw("network_failure_count + {$networkIncrement}"),
                'hardware_failure_count' => DB::raw("hardware_failure_count + {$hardwareIncrement}"),
                'last_error' => mb_substr($message, 0, 1000),
                'updated_at' => now(),
            ]);

        Log::warning('Print telemetry failure.', [
            'tenant_key' => $tenantKey,
            'tenant_name' => $tenantName,
            'printer_type' => $printerType,
            'failure_type' => $failureType,
            'order_id' => $order->id,
            'message' => $message,
        ]);
    }

    private function ensureMetricsRow(string $date, string $tenantKey, string $tenantName, string $printerType): void
    {
        $exists = DB::table('print_metrics')
            ->where('metric_date', $date)
            ->where('tenant_key', $tenantKey)
            ->where('printer_type', $printerType)
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('print_metrics')->insert([
            'id' => (string) str()->uuid(),
            'metric_date' => $date,
            'tenant_key' => $tenantKey,
            'tenant_name' => $tenantName,
            'printer_type' => $printerType,
            'total_attempts' => 0,
            'success_count' => 0,
            'failure_count' => 0,
            'network_failure_count' => 0,
            'hardware_failure_count' => 0,
            'last_error' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function resolveTenant(): array
    {
        $storeSetting = StoreSetting::query()->first();

        $tenantKey = $storeSetting?->id ?? 'default';
        $tenantName = $storeSetting?->store_name ?? config('app.name', 'pedido-feito');

        return [$tenantKey, $tenantName];
    }
}
