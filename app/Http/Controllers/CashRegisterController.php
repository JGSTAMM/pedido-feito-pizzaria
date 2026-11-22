<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\BuildCashRegisterHistoryAction;
use App\Application\CashRegister\BuildCashRegisterSummaryAction;
use App\Application\CashRegister\CashRegisterLockService;
use App\Application\CashRegister\EnsureNoPendingOrdersForCloseAction;
use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashRegisterController extends Controller
{
    public function __construct(
        private readonly BuildCashRegisterSummaryAction $buildCashRegisterSummaryAction,
        private readonly BuildCashRegisterHistoryAction $buildCashRegisterHistoryAction,
        private readonly CashRegisterLockService $cashRegisterLockService,
        private readonly EnsureNoPendingOrdersForCloseAction $ensureNoPendingOrdersForCloseAction,
    ) {}

    public function index(Request $request)
    {
        $register = CashRegister::where('status', 'open')
            ->latest()
            ->first();

        $summary = $register ? $this->buildCashRegisterSummaryAction->execute($register) : null;
        $blockingOrders = $register ? $this->ensureNoPendingOrdersForCloseAction->getBlockingOrders($register) : [];

        return Inertia::render('CashRegister/Index', [
            'register' => $register ? [
                'id' => $register->id,
                'status' => $register->status,
                'opened_at' => $register->opened_at?->format('d/m/Y H:i'),
                'opening_balance' => (float) $register->opening_balance,
            ] : null,
            'summary' => $summary,
            'blockingOrders' => $blockingOrders,
            'history' => $this->buildCashRegisterHistoryAction->execute($request),
            'filters' => [
                'start_date' => $request->start_date ?? null,
                'end_date' => $request->end_date ?? null,
            ],
        ]);
    }

    public function open(Request $request)
    {
        $request->validate(['opening_balance' => 'required|numeric|min:0']);

        $alreadyOpen = DB::transaction(function () use ($request): bool {
            if (CashRegister::where('status', 'open')->lockForUpdate()->exists()) {
                return true;
            }

            CashRegister::create([
                'user_id' => Auth::id(),
                'opened_at' => now(),
                'opening_balance' => $request->opening_balance,
                'status' => 'open',
            ]);

            return false;
        });

        if ($alreadyOpen) {
            return redirect()->back()->withErrors([
                'error' => 'Já existe um caixa aberto no momento. Feche o caixa atual antes de abrir outro.',
            ]);
        }

        return redirect()->back()->with('success', 'Caixa aberto com sucesso!');
    }

    public function close(Request $request)
    {
        $request->validate(['closing_balance' => 'required|numeric|min:0']);

        $register = CashRegister::where('status', 'open')
            ->latest()
            ->firstOrFail();

        try {
            $this->cashRegisterLockService->assertCanCloseRegister($register);
        } catch (OrderActionException $exception) {
            return redirect()->back()->withErrors([
                'error' => $exception->getMessage(),
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
