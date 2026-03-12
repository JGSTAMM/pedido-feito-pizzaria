<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        $register = CashRegister::where('status', 'open')
            ->latest()
            ->first();

        $summary = null;
        if ($register) {
            $orders = Order::where('cash_register_id', $register->id)
                ->whereNotNull('paid_at')
                ->with('payments')
                ->get();

            if ($orders->isEmpty()) {
                $orders = Order::where('created_at', '>=', $register->opened_at)
                    ->whereNotNull('paid_at')
                    ->with('payments')
                    ->get();
            }

            $methods = [];
            foreach ($orders as $order) {
                foreach ($order->payments as $payment) {
                    $methods[$payment->method] = ($methods[$payment->method] ?? 0) + $payment->amount;
                }
            }

            $cashPayments = (float) ($methods['dinheiro'] ?? 0);
            $totalChange = (float) $orders->sum('change_amount');

            $summary = [
                'opening_balance' => (float) $register->opening_balance,
                'total_sales' => (float) $orders->sum('total_amount'),
                'order_count' => $orders->count(),
                'methods' => $methods,
                'total_change' => $totalChange,
                'total_in_drawer' => (float) $register->opening_balance + $cashPayments - $totalChange,
            ];
        }

        return Inertia::render('CashRegister/Index', [
            'register' => $register ? [
                'id' => $register->id,
                'status' => $register->status,
                'opened_at' => $register->opened_at?->format('d/m/Y H:i'),
                'opening_balance' => (float) $register->opening_balance,
            ] : null,
            'summary' => $summary,
            'history' => $this->getHistory($request),
            'filters' => [
                'start_date' => $request->start_date ?? null,
                'end_date' => $request->end_date ?? null,
            ],
        ]);
    }

    private function getHistory(Request $request)
    {
        $query = CashRegister::where('status', 'closed')->latest();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereDate('opened_at', '>=', $request->start_date)
                  ->whereDate('opened_at', '<=', $request->end_date);
        }

        return $query->paginate(10)->withQueryString()->through(function ($r) {
            $orders = Order::where('cash_register_id', $r->id)
                ->whereNotNull('paid_at')
                ->with('payments')
                ->get();

            if ($orders->isEmpty() && $r->opened_at && $r->closed_at) {
                $orders = Order::whereBetween('created_at', [$r->opened_at, $r->closed_at])
                    ->whereNotNull('paid_at')
                    ->with('payments')
                    ->get();
            }

            $methods = [];
            foreach ($orders as $order) {
                foreach ($order->payments as $payment) {
                    $methods[$payment->method] = ($methods[$payment->method] ?? 0) + $payment->amount;
                }
            }

            $cashPayments = (float) ($methods['dinheiro'] ?? 0);
            $totalChange = (float) $orders->sum('change_amount');
            
            // Físico esperado em gaveta = Troco Inicial + Vendas em Dinheiro - Trocos Devolvidos
            $expectedPhysical = (float) $r->opening_balance + $cashPayments - $totalChange;
            // Quebra de Caixa = Saldo Informado pelo Operador - Valor Esperado
            $registerDiff = (float) $r->closing_balance - $expectedPhysical;

            return [
                'id' => $r->id,
                'opened_at' => $r->opened_at?->format('d/m/Y H:i'),
                'closed_at' => $r->closed_at?->format('d/m/Y H:i'),
                'opening_balance' => (float) $r->opening_balance,
                'closing_balance' => (float) $r->closing_balance,
                'notes' => $r->notes,
                'summary' => [
                    'total_sales' => (float) $orders->sum('total_amount'),
                    'order_count' => $orders->count(),
                    'methods' => $methods,
                    'total_change' => $totalChange,
                    'expected_physical' => $expectedPhysical,
                    'register_diff' => $registerDiff,
                ],
            ];
        });
    }

    public function open(Request $request)
    {
        $request->validate(['opening_balance' => 'required|numeric|min:0']);

        CashRegister::create([
            'user_id' => Auth::id(),
            'opened_at' => now(),
            'opening_balance' => $request->opening_balance,
            'status' => 'open',
        ]);

        return redirect()->back()->with('success', 'Caixa aberto com sucesso!');
    }

    public function close(Request $request)
    {
        $request->validate(['closing_balance' => 'required|numeric|min:0']);

        $register = CashRegister::where('status', 'open')
            ->latest()
            ->firstOrFail();

        // ── Blocker: Prevenir fechamento se houver pedidos ativos ou não pagos ──
        $pendingOrdersCount = Order::where(function ($query) use ($register) {
                $query->where('cash_register_id', $register->id)
                      ->orWhere('created_at', '>=', $register->opened_at);
            })
            ->where(function ($query) {
                $query->whereNotIn('status', ['completed', 'rejected', 'cancelled'])
                      ->orWhereNull('paid_at');
            })
            ->count();

        if ($pendingOrdersCount > 0) {
            return redirect()->back()->withErrors([
                'error' => "Operação bloqueada: Existem {$pendingOrdersCount} pedido(s) em aberto ou sem pagamento. Finalize ou cancele todas as contas antes de fechar o caixa."
            ]);
        }

        $register->update([
            'closed_at' => now(),
            'closing_balance' => $request->closing_balance,
            'status' => 'closed',
            'notes' => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Caixa fechado com sucesso!');
    }
}
