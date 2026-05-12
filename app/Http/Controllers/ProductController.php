<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('category')->orderBy('name')->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_active_delivery' => 'boolean',
            'is_active_pos' => 'boolean',
            'variations' => 'nullable|array',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = $path;
        }

        Product::create($validated);

        return redirect()->back()->with('success', 'Produto criado com sucesso.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'is_active_delivery' => 'boolean',
            'is_active_pos' => 'boolean',
            'variations' => 'nullable|array',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                \Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = $path;
        } elseif ($request->boolean('clear_image')) {
            if ($product->image) {
                \Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = null;
        }

        $product->update($validated);

        return redirect()->back()->with('success', 'Produto atualizado com sucesso.');
    }

    public function toggleStatus(Product $product)
    {
        $newStatus = ! ($product->is_active_delivery || $product->is_active_pos);
        $product->update([
            'is_active_delivery' => $newStatus,
            'is_active_pos' => $newStatus,
        ]);

        return redirect()->back()->with('success', 'Status do produto alterado com sucesso.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Produto excluído com sucesso.');
    }
}
