<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WaiterController extends Controller
{
    public function index()
    {
        $tables = Table::with(['activeOrders.items.product', 'activeOrders.items.pizzaSize', 'activeOrders.items.flavors'])
            ->get()
            ->map(function ($table) {
                $activeOrder = $table->activeOrders->first();

                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'status' => $activeOrder ? 'occupied' : 'free',
                    'seats' => $table->capacity ?? 4,
                    'active_order' => $activeOrder ? [
                        'id' => $activeOrder->id,
                        'short_code' => $activeOrder->short_code,
                        'total' => (float) $activeOrder->total_amount,
                        'elapsed_minutes' => (int) $activeOrder->created_at->diffInMinutes(now()),
                        'items' => $activeOrder->items->map(function ($item) {
                            $isPizza = $item->type === 'pizza_custom';
                            return [
                                'id' => $item->id,
                                'quantity' => $item->quantity,
                                'name' => $item->description ?? $item->product?->name ?? 'Item',
                                'unit_price' => (float) $item->unit_price,
                                'subtotal' => (float) $item->subtotal,
                                'type' => $item->type ?? 'product',
                                'is_pizza' => $isPizza,
                                'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                                'flavor_names' => $isPizza ? $item->flavors->pluck('name')->toArray() : [],
                                'notes' => $item->notes ?? null,
                            ];
                        }),
                    ] : null,
                ];
            });

        $stats = [
            'total' => $tables->count(),
            'free' => $tables->where('status', 'free')->count(),
            'occupied' => $tables->where('status', 'occupied')->count(),
        ];

        $products = Product::whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'category' => $p->category,
                'image_url' => $p->image_url,
                'type' => 'product',
            ]);

        $pizzaFlavors = PizzaFlavor::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'price' => (float) $f->base_price,
                'ingredients' => $f->ingredients,
                'flavor_category' => $f->flavor_category,
                'category' => 'Pizzas',
                'image_url' => $f->image_url,
                'type' => 'pizza_flavor',
            ]);

        $categories = Product::select('category')
            ->distinct()
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->pluck('category')
            ->toArray();
        array_unshift($categories, 'Pizzas');

        $pizzaSizes = PizzaSize::orderBy('id')->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'slices' => $s->slices,
            'max_flavors' => $s->max_flavors,
            'is_broto' => (bool) $s->is_special_broto_rule,
        ]);

        $borderOptions = Product::where('category', 'Extras')
            ->where('name', 'like', '%Borda%')
            ->orderBy('price')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
            ]);

        return Inertia::render('Waiter/Index', [
            'tables' => $tables,
            'stats' => $stats,
            'products' => $products,
            'pizzaFlavors' => $pizzaFlavors,
            'pizzaSizes' => $pizzaSizes,
            'categories' => $categories,
            'borderOptions' => $borderOptions,
            'userName' => Auth::user()?->name ?? 'Garçom',
        ]);
    }

    public function orders()
    {
        $user = Auth::user();
        $orders = \App\Models\Order::whereIn('status', ['pending', 'preparing', 'ready'])
            ->with(['items.product', 'table'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'short_code' => $o->short_code,
                'status' => $o->status,
                'total' => (float) $o->total_amount,
                'table_name' => $o->table?->name ?? 'Balcão',
                'created_at' => $o->created_at->format('H:i'),
                'elapsed_minutes' => (int) $o->created_at->diffInMinutes(now()),
                'items_count' => $o->items->sum('quantity'),
            ]);

        return Inertia::render('Waiter/Orders', [
            'orders' => $orders,
            'userName' => $user->name ?? 'Garçom',
        ]);
    }

    public function profile()
    {
        $user = Auth::user();

        return Inertia::render('Waiter/Profile', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'waiter',
                'created_at' => $user->created_at?->format('d/m/Y'),
            ],
        ]);
    }
}
