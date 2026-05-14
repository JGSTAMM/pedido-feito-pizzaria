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
                'total_revenue' => $grossRevenue,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'profit_margin_pct' => round($profitMargin, 2),
                'total_orders' => $totalOrders,
                'avg_ticket' => round($avgTicket, 2),
            ],
            'topProducts' => $topFlavors,
            'typeDistribution' => $typeDistribution,
        ]);
    }

    public function export()
    {
        $last30Days = now()->subDays(30);

        // Revenue based on paid_at instead of status = paid
        $grossRevenue = ((float) Order::whereNotNull('paid_at')
            ->where('created_at', '>=', $last30Days)
            ->sum('total_amount')) / 100;

        $totalOrders = Order::whereNotNull('paid_at')
            ->where('created_at', '>=', $last30Days)
            ->count();

        // Calculate Expenses
        $totalExpenses = ((float) Expense::where('expense_date', '>=', $last30Days->toDateString())
            ->sum('amount')) / 100;

        // Calculate Net Profit
        $netProfit = $grossRevenue - $totalExpenses;

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=relatorio_financeiro_" . now()->format('Y_m_d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($grossRevenue, $totalExpenses, $netProfit, $totalOrders) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 Excel support
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, ['Métrica', 'Valor'], ';');
            fputcsv($file, ['Receita Bruta (R$)', number_format($grossRevenue, 2, ',', '')], ';');
            fputcsv($file, ['Despesas Operacionais (R$)', number_format($totalExpenses, 2, ',', '')], ';');
            fputcsv($file, ['Lucro Líquido (R$)', number_format($netProfit, 2, ',', '')], ';');
            fputcsv($file, ['Total de Pedidos', $totalOrders], ';');

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
