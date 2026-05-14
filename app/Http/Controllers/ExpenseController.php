<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::orderBy('expense_date', 'desc')->get();

        return Inertia::render('Expenses/Index', [
            'expenses' => $expenses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'expense_date' => 'required|date',
            'is_paid' => 'boolean',
        ]);

        Expense::create($validated);

        return redirect()->back()->with('success', 'Despesa criada com sucesso.');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string|max:255',
            'expense_date' => 'required|date',
            'is_paid' => 'boolean',
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Despesa atualizada com sucesso.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Despesa removida com sucesso.');
    }
}
