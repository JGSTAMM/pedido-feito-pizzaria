<?php

namespace App\Http\Controllers;

use App\Models\Neighborhood;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NeighborhoodController extends Controller
{
    public function index()
    {
        $neighborhoods = Neighborhood::select('id', 'name', 'city', 'delivery_fee', 'observation')
            ->orderBy('city')
            ->orderBy('name')
            ->get();

        return Inertia::render('Neighborhoods/Index', [
            'neighborhoods' => $neighborhoods,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'delivery_fee' => 'required|numeric|min:0',
            'observation' => 'nullable|string|max:255',
        ]);

        Neighborhood::create($validated);

        return redirect()->back()->with('success', 'Bairro/Taxa adicionado com sucesso!');
    }

    public function update(Request $request, Neighborhood $neighborhood)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'delivery_fee' => 'required|numeric|min:0',
            'observation' => 'nullable|string|max:255',
        ]);

        $neighborhood->update($validated);

        return redirect()->back()->with('success', 'Bairro/Taxa atualizado com sucesso!');
    }

    public function destroy(Neighborhood $neighborhood)
    {
        $neighborhood->delete();

        return redirect()->back()->with('success', 'Bairro/Taxa removido com sucesso!');
    }
}
