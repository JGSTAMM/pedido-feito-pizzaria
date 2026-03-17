<?php

namespace App\Application\Orders;

use App\Models\Order;
use Illuminate\Support\Collection;

class BuildKdsOrdersAction
{
    public function execute(): Collection
    {
        return Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'table', 'customer'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'type' => $order->type,
                'customer_name' => $order->customer_name ?? 'Cliente',
                'customer_phone' => $order->customer?->phone,
                'table_name' => $order->table?->name,
                'items' => $order->items->map(function ($item) {
                    $isPizza = $item->type === 'pizza_custom';

                    if ($isPizza) {
                        $name = $item->description ?? ('Pizza ' . ($item->pizzaSize?->name ?? ''));
                    } else {
                        $name = $item->description ?? $item->product?->name ?? 'Item';
                    }

                    return [
                        'quantity' => $item->quantity,
                        'name' => $name,
                        'type' => $item->type ?? 'product',
                        'is_pizza' => $isPizza,
                        'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                        'flavor_names' => $isPizza ? $item->flavors->pluck('name')->toArray() : [],
                        'notes' => $item->notes,
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
