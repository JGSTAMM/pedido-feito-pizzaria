<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $last30Days = now()->subDays(30);

        $totalRevenue = (float) Order::where('status', 'paid')
            ->where('created_at', '>=', $last30Days)
            ->sum('total_amount');

        $totalOrders = Order::where('status', 'paid')
            ->where('created_at', '>=', $last30Days)
            ->count();

        $avgTicket = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Top products by sales (last 30 days)
        $topFlavors = collect([]);
        try {
            $topFlavors = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', 'paid')
                ->where('orders.created_at', '>=', $last30Days)
                ->select('products.name', DB::raw('SUM(order_items.quantity) as sales'))
                ->groupBy('products.name')
                ->orderByDesc('sales')
                ->limit(5)
                ->get()
                ->map(fn ($p) => ['name' => $p->name, 'sales' => (int) $p->sales]);
        } catch (\Exception $e) {
            // Table may not exist yet
        }

        // Order type distribution (last 30 days)
        $typeDistribution = Order::where('status', 'paid')
            ->where('created_at', '>=', $last30Days)
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(fn ($t) => ['type' => $t->type, 'count' => $t->count]);

        return Inertia::render('Reports/Index', [
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'avg_ticket' => round($avgTicket, 2),
            ],
            'topProducts' => $topFlavors,
            'typeDistribution' => $typeDistribution,
        ]);
    }
}
