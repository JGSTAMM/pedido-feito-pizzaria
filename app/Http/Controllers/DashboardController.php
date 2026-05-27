<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\Product;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = today();

        $stats = \Illuminate\Support\Facades\Cache::remember('dashboard_stats', 60, fn() => [
            'revenue_today' => ((float) Order::whereDate('paid_at', $today)->sum('total_amount')) / 100,
            'revenue_yesterday' => ((float) Order::whereDate('paid_at', $today->copy()->subDay())->sum('total_amount')) / 100,
            'orders_today' => Order::whereDate('created_at', $today)->count(),
            'orders_yesterday' => Order::whereDate('created_at', $today->copy()->subDay())->count(),
            'active_orders' => Order::whereIn('status', ['pending', 'preparing', 'ready'])->count(),
            'products_count' => Product::count(),
            'flavors_count' => PizzaFlavor::count(),
            'cash_register_open' => CashRegister::where('status', 'open')->exists(),
        ]);

        $recentOrders = Order::with('table')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'short_code' => $o->short_code,
                'customer_name' => $o->customer_name ?? 'Cliente',
                'total_amount' => (float) $o->total_amount,
                'status' => $o->status,
                'created_at' => $o->created_at->format('H:i'),
            ]);

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
        ]);
    }
}
