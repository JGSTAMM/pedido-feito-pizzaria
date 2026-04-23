<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Display the orders list page.
     */
    public function index()
    {
        $orders = Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'payments', 'table', 'user'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'type' => $order->type,
                'is_paid' => $order->paid_at !== null,
                'customer_name' => $order->customer_name ?? 'Cliente',
                'customer_phone' => $order->customer_phone,
                'delivery_address' => $order->delivery_address,
                'delivery_complement' => $order->delivery_complement,
                'neighborhood' => $order->neighborhood_name ?? ($order->neighborhood?->name),
                'total_amount' => (float) $order->total_amount,
                'items_count' => $order->items->sum('quantity'),
                'payment_method' => $order->payments->first()?->method ?? '-',
                'table_name' => $order->table?->name ?? null,
                'created_at' => $order->created_at->format('d/m/Y H:i'),
                'created_at_relative' => $order->created_at->diffForHumans(),
                'items' => $order->items->map(fn($item) => [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'name' => $item->product ? $item->product->name : ($item->pizzaSize ? 'Pizza ' . $item->pizzaSize->name . ' (' . $item->flavors->pluck('name')->join(', ') . ')' : 'Item Customizado'),
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->subtotal,
                    'notes' => $item->notes,
                    'description' => $item->description,
                ]),
            ]);

        // Stats
        $todayOrders = Order::whereDate('created_at', today());
        $stats = [
            'total_today' => $todayOrders->count(),
            'revenue_today' => (float) $todayOrders->clone()->whereNotNull('paid_at')->sum('total_amount'),
            'pending_count' => Order::whereIn('status', ['pending', 'preparing', 'ready'])->count(),
            'completed_today' => $todayOrders->clone()->whereNotNull('paid_at')->count(),
        ];

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
        ]);
    }
}
