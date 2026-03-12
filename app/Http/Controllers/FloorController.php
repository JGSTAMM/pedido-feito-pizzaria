<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use App\Services\PizzaPriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FloorController extends Controller
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

        // ── Catalog Data (same as PosController) ──
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

        return Inertia::render('Floor/Index', [
            'tables' => $tables,
            'stats' => $stats,
            'products' => $products,
            'pizzaFlavors' => $pizzaFlavors,
            'pizzaSizes' => $pizzaSizes,
            'categories' => $categories,
            'borderOptions' => $borderOptions,
        ]);
    }

    /**
     * Add items to a table's order (create new or append to existing).
     * Replicates PosController@store logic for item saving, but for dine_in.
     */
    public function addItems(Table $table, Request $request)
    {
        // Validate Cash Register State Before Anything Else
        $activeRegister = \App\Models\CashRegister::where('status', 'open')->latest()->first();
        if (!$activeRegister) {
            return redirect()->back()->withErrors(['error' => 'Operação bloqueada: O caixa está fechado. Peça ao gerente para abrir o caixa.']);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|string',
            'items.*.type' => 'required|in:product,pizza_flavor,pizza_custom',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.size_id' => 'nullable|string',
            'items.*.flavor_ids' => 'nullable|array',
            'items.*.border_id' => 'nullable|string',
            'items.*.observation' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $totalAmount = 0;
            $itemsData = [];
            $priceService = new PizzaPriceService();

            foreach ($validated['items'] as $item) {
                if ($item['type'] === 'product') {
                    $product = Product::findOrFail($item['id']);
                    $unitPrice = (float) $product->price;
                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'product',
                        'product_id' => $item['id'],
                        'pizza_size_id' => null,
                        'flavor_ids' => [],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'description' => $product->name,
                        'notes' => null,
                    ];
                } elseif ($item['type'] === 'pizza_custom') {
                    $sizeId = $item['size_id'];
                    $flavorIds = $item['flavor_ids'] ?? [];
                    $borderId = $item['border_id'] ?? null;
                    $customerObs = $item['observation'] ?? null;

                    $unitPrice = $priceService->calculateItemPrice($sizeId, $flavorIds);
                    $borderName = null;
                    if ($borderId) {
                        $borderProd = Product::find($borderId);
                        if ($borderProd) {
                            $unitPrice += (float) $borderProd->price;
                            $borderName = $borderProd->name;
                        }
                    }

                    $size = PizzaSize::find($sizeId);
                    $flavors = PizzaFlavor::whereIn('id', $flavorIds)->pluck('name')->toArray();
                    $sizeName = $size ? $size->name : 'Pizza';
                    $description = "Pizza {$sizeName}";

                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'pizza_custom',
                        'product_id' => null,
                        'pizza_size_id' => $sizeId,
                        'flavor_ids' => $flavorIds,
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'description' => $description,
                        'notes' => $customerObs,
                    ];
                } else {
                    // pizza_flavor — simple add (legacy)
                    $flavor = PizzaFlavor::findOrFail($item['id']);
                    $unitPrice = (float) $flavor->base_price;
                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'pizza_flavor',
                        'product_id' => null,
                        'pizza_size_id' => null,
                        'flavor_ids' => [$item['id']],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'description' => $flavor->name,
                        'notes' => null,
                    ];
                }
            }

            // Find or create active order for this table
            $order = $table->activeOrders()->first();

            if ($order) {
                // Append to existing order — update total
                $order->update([
                    'total_amount' => (float) $order->total_amount + $totalAmount,
                ]);
            } else {
                // Create new dine_in order for this table
                $order = Order::create([
                    'status' => 'pending',
                    'type' => 'dine_in',
                    'total_amount' => $totalAmount,
                    'customer_name' => 'Mesa ' . $table->name,
                    'table_id' => $table->id,
                    'cash_register_id' => $activeRegister?->id,
                    'user_id' => Auth::id(),
                ]);
            }

            // Create order items
            foreach ($itemsData as $data) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $data['product_id'],
                    'pizza_size_id' => $data['pizza_size_id'],
                    'quantity' => $data['quantity'],
                    'unit_price' => $data['unit_price'],
                    'subtotal' => $data['subtotal'],
                    'type' => $data['type'],
                    'description' => $data['description'] ?? null,
                    'notes' => $data['notes'],
                ]);

                if (!empty($data['flavor_ids'])) {
                    $fraction = '1/' . count($data['flavor_ids']);
                    foreach ($data['flavor_ids'] as $flavorId) {
                        $orderItem->flavors()->attach($flavorId, [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'fraction' => $fraction
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', "Itens enviados para a cozinha! Pedido #{$order->id}");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erro ao lançar itens: ' . $e->getMessage());
        }
    }

    /**
     * Pay and close table (Web Interface)
     */
    public function payAndClose(Request $request, Table $table)
    {
        $validated = $request->validate([
            'payments' => 'required|array',
            'payments.*.method' => 'required|string',
            'payments.*.amount' => 'required|numeric|min:0',
        ]);

        // Get active orders
        $orders = Order::where('table_id', $table->id)
            ->whereNotIn('status', ['completed', 'paid', 'cancelled'])
            ->get();

        if ($orders->isEmpty()) {
            return redirect()->back()->with('error', 'Nenhum pedido ativo');
        }

        $totalAmount = $orders->sum('total_amount');
        $totalPaid = collect($validated['payments'])->sum('amount');

        if ($totalPaid < $totalAmount - 0.01) {
             return redirect()->back()->with('error', 'Valor pago insuficiente');
        }

        // Find the store's active cash register
        $activeRegister = \App\Models\CashRegister::where('status', 'open')
            ->latest()
            ->first();

        DB::beginTransaction();
        try {
            $paymentPool = collect($validated['payments'])->map(function($p) {
                return ['method' => $p['method'], 'amount' => (float)$p['amount']];
            })->toArray();

            $pIndex = 0;

            foreach ($orders as $index => $order) {
                $amountToPayForOrder = (float)$order->total_amount;
                
                // Distribute payment to this order
                while ($amountToPayForOrder > 0.001 && $pIndex < count($paymentPool)) {
                    $currentMethod = &$paymentPool[$pIndex];
                    if ($currentMethod['amount'] <= 0) {
                        $pIndex++;
                        continue;
                    }

                    $take = min($currentMethod['amount'], $amountToPayForOrder);

                    \App\Models\Payment::create([
                        'order_id' => $order->id,
                        'method' => $currentMethod['method'],
                        'amount' => $take,
                    ]);

                    $currentMethod['amount'] -= $take;
                    $amountToPayForOrder -= $take;

                    if ($currentMethod['amount'] <= 0.001) {
                        $pIndex++;
                    }
                }
                
                // If last order, dump remaining payment (change)
                if ($index === $orders->count() - 1) {
                     while($pIndex < count($paymentPool)) {
                        if ($paymentPool[$pIndex]['amount'] > 0.001) {
                            \App\Models\Payment::create([
                                'order_id' => $order->id,
                                'method' => $paymentPool[$pIndex]['method'],
                                'amount' => $paymentPool[$pIndex]['amount'],
                            ]);
                        }
                        $pIndex++;
                     }
                }

                // Update order to 'completed' so it leaves the table's activeOrders scope
                $order->update([
                    'status' => 'completed',
                    'paid_at' => now(),
                    'cash_register_id' => $activeRegister?->id,
                ]);
            }

            $table->update(['status' => 'available']);

            DB::commit();
            
            return redirect()->back()->with('success', 'Mesa fechada com sucesso!');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erro ao processar o pagamento: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
        ]);

        Table::create($validated);

        return redirect()->back()->with('success', 'Mesa criada com sucesso.');
    }

    public function update(Request $request, Table $table)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
        ]);

        $table->update($validated);

        return redirect()->back()->with('success', 'Mesa atualizada com sucesso.');
    }

    public function destroy(Table $table)
    {
        $table->delete();

        return redirect()->back()->with('success', 'Mesa excluída com sucesso.');
    }
}
