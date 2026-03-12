<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\PizzaFlavor;
use App\Models\CashRegister;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = today();

        $todayOrders = Order::whereDate('created_at', $today);
        $yesterdayOrders = Order::whereDate('created_at', $today->copy()->subDay());

        $stats = [
            'revenue_today' => (float) $todayOrders->clone()->whereNotNull('paid_at')->sum('total_amount'),
            'revenue_yesterday' => (float) $yesterdayOrders->clone()->whereNotNull('paid_at')->sum('total_amount'),
            'orders_today' => $todayOrders->clone()->count(),
            'orders_yesterday' => $yesterdayOrders->clone()->count(),
            'active_orders' => Order::whereIn('status', ['pending', 'preparing', 'ready'])->count(),
            'products_count' => Product::count(),
            'flavors_count' => PizzaFlavor::count(),
            'cash_register_open' => CashRegister::where('status', 'open')->exists(),
        ];

        $recentOrders = Order::with('table')
            ->orderByDesc('created_at')
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
