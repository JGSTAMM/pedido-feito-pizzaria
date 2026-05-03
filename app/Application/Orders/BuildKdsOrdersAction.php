<?php

namespace App\Application\Orders;

use App\Models\Order;
use Illuminate\Support\Collection;

class BuildKdsOrdersAction
{
    public function execute(): Collection
    {
        return Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'table', 'neighborhood'])
            ->whereIn('status', ['pending', 'preparing', 'ready', 'accepted'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'type' => $order->type,
                'customer_name' => $order->customer_name ?? 'Cliente',
                'customer_phone' => $order->customer_phone,
                'payer_email' => $order->payer_email,
                'delivery_address' => $order->delivery_address,
                'delivery_complement' => $order->delivery_complement,
                'neighborhood_name' => $order->neighborhood?->name ?? $order->custom_neighborhood,
                'table_name' => $order->table?->name,
                'payment_method_online' => $order->payment_method_online,
                'online_payment_status' => $order->online_payment_status,
                'is_paid' => $order->paid_at !== null || $order->online_payment_status === 'approved',
                'total_amount' => (float) $order->total_amount,
                'notes' => $order->notes,
                'items' => $order->items->map(function ($item) {
                    $isPizza = in_array($item->type, ['pizza', 'pizza_custom']);

                    if ($isPizza) {
                        $size = $item->pizzaSize?->name ?? '';
                        $flavors = $item->flavors->pluck('name')->join(', ');
                        $name = trim("{$size} — {$flavors}", ' — ');
                        if (empty($name)) {
                            $name = 'Pizza';
                        }
                    } else {
                        $name = $item->product?->name ?? 'Item';
                    }

                    // Unified modifications logic for KDS (Description + Notes)
                    $rawCustom = (string)$item->description;
                    $rawNotes = (string)$item->notes;

                    // Clean up redundant pizza size info
                    if ($isPizza && isset($size) && $size) {
                        $sizePattern = "Pizza {$size}";
                        $rawCustom = str_ireplace([$sizePattern, $size], '', $rawCustom);
                        $rawNotes = str_ireplace([$sizePattern, $size], '', $rawNotes);
                    }

                    $parts = array_filter([
                        trim($rawCustom, " |,-."),
                        trim($rawNotes, " |,-.")
                    ]);

                    $unifiedNotes = implode('|', $parts);
                    $unifiedNotes = empty($unifiedNotes) ? null : $unifiedNotes;

                    return [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'name' => $name,
                        'type' => $item->type ?? 'product',
                        'is_pizza' => $isPizza,
                        'customization' => null,
                        'notes' => $unifiedNotes,
                        'is_beverage' => $item->product && in_array(strtolower($item->product->category), ['bebida', 'bebidas', 'drinks', 'suco', 'sucos', 'refrigerante', 'cerveja']),
                    ];
                }),
                'created_at' => $order->created_at->format('H:i'),
                'created_at_iso' => $order->created_at->toIso8601String(),
                'elapsed_minutes' => $order->created_at->diffInMinutes(now()),
            ]);
    }

    public function buildCounts(Collection $orders): array
    {
        return [
            'pending' => $orders->where('status', 'pending')->count(),
            'preparing' => $orders->where('status', 'preparing')->count(),
            'ready' => $orders->where('status', 'ready')->count(),
        ];
    }
}
