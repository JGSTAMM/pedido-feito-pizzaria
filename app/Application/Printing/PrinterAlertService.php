<?php

namespace App\Application\Printing;

use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrinterAlertService
{
    public function raiseHardwareAlert(
        Order $order,
        string $printerType,
        string $errorCode,
        string $message,
    ): void {
        [$tenantKey, $tenantName] = $this->resolveTenant();

        DB::table('printer_alerts')->insert([
            'id' => (string) str()->uuid(),
            'tenant_key' => $tenantKey,
            'tenant_name' => $tenantName,
            'order_id' => $order->id,
            'printer_type' => $printerType,
            'error_code' => $errorCode,
            'message' => mb_substr($message, 0, 2000),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Log::alert('Printer hardware alert raised.', [
            'tenant_key' => $tenantKey,
            'tenant_name' => $tenantName,
            'order_id' => $order->id,
            'printer_type' => $printerType,
            'error_code' => $errorCode,
            'message' => $message,
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
