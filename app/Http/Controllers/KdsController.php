<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;

class KdsController extends Controller
{
    public function index()
    {
        $orders = Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'table', 'customer'])
            ->whereIn('status', ['pending', 'preparing', 'ready'])
            ->orderBy('created_at')
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'type' => $order->type,
                'customer_name' => $order->customer_name ?? 'Cliente',
                'customer_phone' => $order->customer?->phone ?? null,
                'table_name' => $order->table?->name ?? null,
                'items' => $order->items->map(function ($item) {
                    $isPizza = $item->type === 'pizza_custom';

                    // Build the display name
                    if ($isPizza) {
                        $name = $item->description ?? ('Pizza ' . ($item->pizzaSize?->name ?? ''));
                    } else {
                        $name = $item->description ?? $item->product?->name ?? 'Item';
                    }

                    // Get flavor names from the pivot table
                    $flavorNames = $isPizza
                        ? $item->flavors->pluck('name')->toArray()
                        : [];

                    // Get border info (border is stored in the notes legacy, or we detect from flavor/size context)
                    // For new orders, border_name is not stored separately on order_items,
                    // but the price includes it. We'll parse from description or just show flavors.

                    return [
                        'quantity' => $item->quantity,
                        'name' => $name,
                        'type' => $item->type ?? 'product',
                        'is_pizza' => $isPizza,
                        'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                        'flavor_names' => $flavorNames,
                        'notes' => $item->notes ?? null,
                    ];
                }),
                'created_at' => $order->created_at->format('H:i'),
                'created_at_iso' => $order->created_at->toIso8601String(),
                'elapsed_minutes' => $order->created_at->diffInMinutes(now()),
            ]);

        $counts = [
            'pending' => $orders->where('status', 'pending')->count(),
            'preparing' => $orders->where('status', 'preparing')->count(),
            'ready' => $orders->where('status', 'ready')->count(),
        ];

        return Inertia::render('KDS/Index', [
            'orders' => $orders,
            'counts' => $counts,
        ]);
    }

    public function updateStatus(Order $order, $status)
    {
        if (in_array($status, ['preparing', 'ready', 'delivered'])) {
            $order->update(['status' => $status]);
        }

        return redirect()->back();
    }
}
