<?php

namespace App\Http\Controllers;

use App\Models\PizzaFlavor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FlavorController extends Controller
{
    public function index()
    {
        $flavors = PizzaFlavor::orderBy('name')->get();

        return Inertia::render('Flavors/Index', [
            'flavors' => $flavors,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        PizzaFlavor::create($validated);

        return redirect()->back()->with('success', 'Sabor criado com sucesso.');
    }

    public function update(Request $request, PizzaFlavor $flavor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $flavor->update($validated);

        return redirect()->back()->with('success', 'Sabor atualizado com sucesso.');
    }

    public function toggleStatus(PizzaFlavor $flavor)
    {
        $flavor->update(['is_active' => !$flavor->is_active]);

        return redirect()->back()->with('success', 'Status do sabor alterado com sucesso.');
    }

    public function destroy(PizzaFlavor $flavor)
    {
        $flavor->delete();

        return redirect()->back()->with('success', 'Sabor excluído com sucesso.');
    }
}
