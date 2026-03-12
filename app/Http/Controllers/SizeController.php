<?php

namespace App\Http\Controllers;

use App\Models\PizzaSize;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SizeController extends Controller
{
    public function index()
    {
        $sizes = PizzaSize::orderBy('max_flavors')->get();

        return Inertia::render('Sizes/Index', [
            'sizes' => $sizes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slices' => 'required|integer|min:1',
            'max_flavors' => 'required|integer|min:1',
            'is_special_broto_rule' => 'boolean',
        ]);

        PizzaSize::create($validated);

        return redirect()->back()->with('success', 'Tamanho criado com sucesso.');
    }

    public function update(Request $request, PizzaSize $size)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slices' => 'required|integer|min:1',
            'max_flavors' => 'required|integer|min:1',
            'is_special_broto_rule' => 'boolean',
        ]);

        $size->update($validated);

        return redirect()->back()->with('success', 'Tamanho atualizado com sucesso.');
    }

    public function destroy(PizzaSize $size)
    {
        $size->delete();

        return redirect()->back()->with('success', 'Tamanho excluído com sucesso.');
    }
}
