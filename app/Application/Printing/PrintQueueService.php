<?php

namespace App\Application\Printing;

use App\Models\Order;
use App\Models\PrinterSetting;
use App\Models\PrintJob;
use App\Models\StoreSetting;
use App\Models\Table;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PrintQueueService
{
    public function enqueueKitchenTicket(Order $order, bool $force = false): ?PrintJob
    {
        // Avoid accidental immediate duplicates
        if (! $force) {
            $recent = PrintJob::where('order_id', $order->id)
                ->where('type', 'kitchen')
                ->where('created_at', '>=', now()->subSeconds(20))
                ->exists();

            if ($recent) {
                return null;
            }
        }

        $order->loadMissing(['items.product', 'items.pizzaSize', 'items.flavors', 'table']);

        $kitchenItems = [];
        foreach ($order->items as $item) {
            $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true);
            $sizeName = $isPizza ? ($item->pizzaSize?->name ?? null) : null;
            $flavorNames = $isPizza ? $item->flavors->pluck('name')->filter()->values()->toArray() : [];
            $flavorsCount = count($flavorNames);

            $productName = $item->product?->name;
            $category = $item->product?->category;

            $isBeverage = OrderItemClassifier::isBeverage($isPizza, $category, $productName, $item->description);
            if ($isBeverage) {
                continue; // Beverages never go to kitchen
            }

            $displayTitle = $isPizza
                ? OrderItemClassifier::formatPizzaTitle($sizeName, $flavorsCount, $item->description)
                : ($productName ?: ($item->description ?: 'Item'));

            $notes = OrderItemClassifier::cleanNotes(
                rawCustom: $item->description,
                rawNotes: $item->notes,
                itemName: $displayTitle,
                productName: $productName,
                isPizza: $isPizza,
                sizeName: $sizeName
            );

            $kitchenItems[] = [
                'id' => $item->id,
                'quantity' => (int) $item->quantity,
                'name' => $displayTitle,
                'is_pizza' => $isPizza,
                'size_name' => $sizeName,
                'flavor_names' => $flavorNames,
                'notes' => $notes,
            ];
        }

        // If order has no kitchen items (e.g. only beverages), skip kitchen printing entirely!
        if (empty($kitchenItems)) {
            return null;
        }

        $tableName = $order->table?->name ? trim((string) $order->table->name) : 'Balcão';
        $tableLabel = preg_match('/^mesa\b/i', $tableName) ? strtoupper($tableName) : 'MESA '.strtoupper($tableName);

        $payload = [
            'type' => 'kitchen',
            'order_id' => $order->id,
            'short_code' => $order->short_code ?: strtoupper(substr((string) $order->id, 0, 5)),
            'table_name' => $tableLabel,
            'customer_name' => $order->customer_name ?: null,
            'created_at' => $order->created_at ? $order->created_at->format('H:i:s') : now()->format('H:i:s'),
            'date' => $order->created_at ? $order->created_at->format('d/m/Y') : now()->format('d/m/Y'),
            'items' => $kitchenItems,
        ];

        return PrintJob::create([
            'order_id' => $order->id,
            'table_id' => $order->table_id,
            'type' => 'kitchen',
            'target' => 'kitchen',
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    public function enqueueTableBill(Table $table): ?PrintJob
    {
        $activeOrders = $table->activeOrders()
            ->with(['items.product', 'items.pizzaSize', 'items.flavors'])
            ->get();

        if ($activeOrders->isEmpty()) {
            return null;
        }

        $store = StoreSetting::first();
        $first = $activeOrders->first();
        $subtotal = (float) $activeOrders->sum('total_amount');
        $serviceFee = round($activeOrders->sum('service_fee_amount') / 100, 2);
        $discount = round($activeOrders->sum('discount_amount') / 100, 2);
        $totalAmount = max(0.0, round($subtotal + $serviceFee - $discount, 2));

        $tableName = trim((string) $table->name);
        $tableLabel = preg_match('/^mesa\b/i', $tableName) ? strtoupper($tableName) : 'MESA '.strtoupper($tableName);

        $payload = array_merge($this->buildStoreBillHeader($store), [
            'type' => 'bill',
            'table_id' => $table->id,
            'table_name' => $tableLabel,
            'customer_name' => $first->customer_name ?: null,
            'short_code' => $first->short_code ?: strtoupper(substr((string) $first->id, 0, 5)),
            'date' => now()->format('d/m/Y'),
            'time' => now()->format('H:i:s'),
            'items' => $this->formatBillItems($activeOrders),
            'subtotal' => $subtotal,
            'service_fee' => $serviceFee,
            'discount' => $discount,
            'total' => $totalAmount,
        ]);

        return PrintJob::create([
            'order_id' => $first->id,
            'table_id' => $table->id,
            'type' => 'bill',
            'target' => 'cash_register',
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    public function enqueueOrderBill(Order $order, ?float $overrideDiscount = null): PrintJob
    {
        $order->loadMissing(['items.product', 'items.pizzaSize', 'items.flavors', 'table']);

        $store = StoreSetting::first();
        $subtotal = (float) $order->total_amount;
        $deliveryFee = (float) $order->delivery_fee;
        $serviceFee = round(($order->service_fee_amount ?? 0) / 100, 2);
        $discount = $overrideDiscount !== null
            ? max(0.0, round($overrideDiscount, 2))
            : round(($order->discount_amount ?? 0) / 100, 2);
        $totalAmount = max(0.0, round($subtotal + $deliveryFee + $serviceFee - $discount, 2));

        $tableName = $order->table?->name
            ? (preg_match('/^mesa\b/i', trim((string) $order->table->name))
                ? strtoupper(trim((string) $order->table->name))
                : 'MESA '.strtoupper(trim((string) $order->table->name)))
            : ($order->type === 'delivery' ? 'DELIVERY' : 'BALCAO / RETIRADA');

        $payload = array_merge($this->buildStoreBillHeader($store), [
            'type' => 'bill',
            'order_id' => $order->id,
            'table_id' => $order->table_id,
            'table_name' => $tableName,
            'customer_name' => $order->customer_name ?: null,
            'customer_phone' => $order->customer_phone ?: null,
            'delivery_address' => $order->delivery_address ?: null,
            'short_code' => $order->short_code ?: strtoupper(substr((string) $order->id, 0, 5)),
            'date' => now()->format('d/m/Y'),
            'time' => now()->format('H:i:s'),
            'items' => $this->formatBillItems([$order]),
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'service_fee' => $serviceFee,
            'discount' => $discount,
            'total' => $totalAmount,
            'is_order_bill' => true,
            'notes' => $order->notes ? trim((string) $order->notes) : null,
        ]);

        return PrintJob::create([
            'order_id' => $order->id,
            'table_id' => $order->table_id,
            'type' => 'bill',
            'target' => 'cash_register',
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    /**
     * @param  iterable<int, Order>  $orders
     * @return array<int, array<string, mixed>>
     */
    private function formatBillItems(iterable $orders): array
    {
        $billItems = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true);
                $sizeName = $isPizza ? ($item->pizzaSize?->name ?? null) : null;
                $flavorNames = $isPizza ? $item->flavors->pluck('name')->filter()->values()->toArray() : [];
                $flavorsCount = count($flavorNames);
                $productName = $item->product?->name;

                $displayTitle = $isPizza
                    ? OrderItemClassifier::formatPizzaTitle($sizeName, $flavorsCount, $item->description)
                    : ($productName ?: ($item->description ?: 'Item'));

                $notes = OrderItemClassifier::cleanNotes(
                    rawCustom: $item->description,
                    rawNotes: $item->notes,
                    itemName: $displayTitle,
                    productName: $productName,
                    isPizza: $isPizza,
                    sizeName: $sizeName
                );

                $unitPrice = (float) $item->unit_price;
                $quantity = (int) $item->quantity;
                $subtotal = (float) ($item->subtotal ?: ($unitPrice * $quantity));

                $billItems[] = [
                    'id' => $item->id,
                    'quantity' => $quantity,
                    'name' => $displayTitle,
                    'is_pizza' => $isPizza,
                    'size_name' => $sizeName,
                    'flavor_names' => $flavorNames,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                    'notes' => $notes,
                ];
            }
        }

        return $billItems;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildStoreBillHeader(?StoreSetting $store): array
    {
        return [
            'store_name' => $store?->store_name ?: 'PEDIDO FEITO',
            'store_header_1' => $store?->receipt_header_1 ?: $store?->store_name ?: 'PEDIDO FEITO',
            'store_header_2' => $store?->receipt_header_2 ?: null,
            'cnpj' => ($store?->receipt_show_cnpj && $store?->cnpj) ? $store->cnpj : null,
            'footer_msg' => $store?->receipt_footer ?: null,
        ];
    }

    public function enqueueTestTicket(string $target = 'kitchen'): PrintJob
    {
        $payload = [
            'type' => 'test',
            'target' => $target,
            'title' => 'TESTE DE IMPRESSÃO AUTOMÁTICA',
            'time' => now()->format('d/m/Y H:i:s'),
            'target_label' => $target === 'kitchen' ? 'COZINHA (80mm/58mm)' : 'CAIXA / CONFERÊNCIA (58mm/80mm)',
            'message' => 'Comunicação direta com o Agente de Impressão Local funcionando perfeitamente!',
        ];

        return PrintJob::create([
            'type' => 'test',
            'target' => $target,
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    public function getOrCreateAgentToken(): string
    {
        $setting = PrinterSetting::where('key', 'print_agent_token')->first();
        if ($setting && ! empty($setting->value)) {
            return (string) $setting->value;
        }

        $envToken = env('PRINT_AGENT_TOKEN');
        if (! empty($envToken)) {
            $seeded = (string) $envToken;
            PrinterSetting::updateOrCreate(
                ['key' => 'print_agent_token'],
                ['value' => $seeded]
            );
            Cache::forget('printer_settings');

            return $seeded;
        }

        $generated = 'pf_print_'.Str::random(40);
        PrinterSetting::updateOrCreate(
            ['key' => 'print_agent_token'],
            ['value' => $generated]
        );
        Cache::forget('printer_settings');

        return $generated;
    }

    public function regenerateAgentToken(): string
    {
        $generated = 'pf_print_'.Str::random(40);
        PrinterSetting::updateOrCreate(
            ['key' => 'print_agent_token'],
            ['value' => $generated]
        );
        Cache::forget('printer_settings');

        return $generated;
    }

    public function recordHeartbeat(array $meta): void
    {
        $meta['last_seen'] = now()->toIso8601String();
        $meta['last_seen_timestamp'] = now()->timestamp;
        Cache::put('print_agent_heartbeat', $meta, now()->addSeconds(20));
    }

    public function getAgentStatus(): array
    {
        $isOnline = Cache::has('print_agent_heartbeat');
        $meta = Cache::get('print_agent_heartbeat', []);

        return [
            'is_online' => $isOnline,
            'last_seen' => $meta['last_seen'] ?? null,
            'version' => $meta['version'] ?? null,
            'platform' => $meta['platform'] ?? null,
            'printers' => $meta['printers'] ?? [],
            'active_printer' => $meta['active_printer'] ?? null,
        ];
    }

    /**
     * Summarize print job queue counts for admin observability.
     *
     * @return array<string, int>
     */
    public function getQueueStats(): array
    {
        return [
            'pending' => PrintJob::where('status', 'pending')->count(),
            'processing' => PrintJob::where('status', 'processing')->count(),
            'failed' => PrintJob::where('status', 'failed')->count(),
            'printed_today' => PrintJob::where('status', 'printed')
                ->whereDate('printed_at', today())
                ->count(),
        ];
    }

    public function clearPendingJobs(): int
    {
        return PrintJob::whereIn('status', ['pending', 'processing'])->delete();
    }

    public function retryFailedJobs(): int
    {
        return PrintJob::where('status', 'failed')->update([
            'status' => 'pending',
            'attempts' => 0,
            'claimed_at' => null,
            'error_message' => null,
        ]);
    }
}
