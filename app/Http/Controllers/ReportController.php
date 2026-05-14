<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $last30Days = now()->subDays(30);

        // Revenue based on paid_at instead of status = paid
        $grossRevenue = ((float) Order::whereNotNull('paid_at')
            ->where('created_at', '>=', $last30Days)
            ->sum('total_amount')) / 100;

        $totalOrders = Order::whereNotNull('paid_at')
            ->where('created_at', '>=', $last30Days)
            ->count();

        $avgTicket = $totalOrders > 0 ? $grossRevenue / $totalOrders : 0;

        // Calculate Expenses
        $totalExpenses = ((float) Expense::where('expense_date', '>=', $last30Days->toDateString())
            ->sum('amount')) / 100;

        // Calculate Net Profit
        $netProfit = $grossRevenue - $totalExpenses;

        // Calculate Profit Margin
        $profitMargin = $grossRevenue > 0 ? ($netProfit / $grossRevenue) * 100 : 0;

        // Top products by sales (last 30 days)
        $topFlavors = collect([]);
        try {
            $topFlavors = DB::table('order_items')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->whereNotNull('orders.paid_at')
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
        $typeDistribution = Order::whereNotNull('paid_at')
            ->where('created_at', '>=', $last30Days)
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(fn ($t) => ['type' => $t->type, 'count' => $t->count]);

        return Inertia::render('Reports/Index', [
            'stats' => [
                'gross_revenue' => $grossRevenue,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'profit_margin' => round($profitMargin, 2),
                'total_orders' => $totalOrders,
                'avg_ticket' => round($avgTicket, 2),
            ],
            'topProducts' => $topFlavors,
            'typeDistribution' => $typeDistribution,
        ]);
    }
}
