<?php

namespace App\Http\Controllers;

use App\Application\Orders\CreateCounterOrderAction;
use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class WaiterController extends Controller
{
    public function __construct(
        private readonly CreateCounterOrderAction $createCounterOrderAction,
    ) {}

    public function index(): \Inertia\Response
    {
        $tables = Table::with(['activeOrders.items.product', 'activeOrders.items.pizzaSize', 'activeOrders.items.flavors'])
            ->get()
            ->map(function ($table) {
                /** @var \App\Models\Table $table */
                $activeOrders = $table->activeOrders;
                $hasActive = $activeOrders->isNotEmpty();

                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'status' => $hasActive ? 'occupied' : 'free',
                    'seats' => $table->capacity ?? 4,
                    'active_orders' => $activeOrders->map(function ($order) {
                        return [
                            'id' => $order->id,
                            'short_code' => $order->short_code,
                            'total' => (float) $order->total_amount,
                            'elapsed_minutes' => (int) $order->created_at->diffInMinutes(now()),
                            'items' => $order->items->map(function ($item) {
                                $isPizza = $item->type === 'pizza_custom';

                                return [
                                    'id' => $item->id,
                                    'quantity' => $item->quantity,
                                    'name' => $item->description ?? $item->product?->name ?? 'Item',
                                    'price' => (float) $item->unit_price,
                                    'unit_price' => (float) $item->unit_price,
                                    'subtotal' => (float) $item->subtotal,
                                    'type' => $item->type ?? 'product',
                                    'is_pizza' => $isPizza,
                                    'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                                    'flavor_names' => $isPizza ? $item->flavors->pluck('name')->toArray() : [],
                                    'notes' => $item->notes ?? null,
                                ];
                            })->values()->toArray(),
                        ];
                    })->values()->toArray(),
                    // Consolidate for backward compatibility in the grid and ReceiptPrint
                    'active_order' => $hasActive ? [
                        'id' => $activeOrders->first()->id,
                        'table_id' => $table->id,
                        'table_name' => $table->name,
                        'short_code' => $activeOrders->first()->short_code,
                        'total' => (float) $activeOrders->sum('total_amount'),
                        'elapsed_minutes' => (int) $activeOrders->first()->created_at->diffInMinutes(now()),
                        'items' => $activeOrders->flatMap(function ($order) {
                            return $order->items->map(function ($item) {
                                $isPizza = $item->type === 'pizza_custom';
                                return [
                                    'id' => $item->id,
                                    'quantity' => $item->quantity,
                                    'name' => $item->description ?? $item->product?->name ?? 'Item',
                                    'price' => (float) $item->unit_price, // Needed for ReceiptPrint
                                    'unit_price' => (float) $item->unit_price,
                                    'subtotal' => (float) $item->subtotal,
                                    'type' => $item->type ?? 'product',
                                    'is_pizza' => $isPizza,
                                    'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                                    'flavor_names' => $isPizza ? $item->flavors->pluck('name')->toArray() : [],
                                    'notes' => $item->notes ?? null,
                                ];
                            });
                        })->values()->toArray(),
                    ] : null,
                ];
            })->values();

        $stats = [
            'total' => $tables->count(),
            'free' => $tables->where('status', 'free')->count(),
            'occupied' => $tables->where('status', 'occupied')->count(),
        ];

        return Inertia::render('Waiter/Index', [
            'tables' => $tables,
            'stats' => $stats,
            ...$this->loadCatalogData(posOnly: false),
            'userName' => Auth::user()?->name ?? 'Garçom',
        ]);
    }

    public function counter(): \Inertia\Response
    {
        $cashRegisterOpen = CashRegister::where('status', 'open')->exists();

        return Inertia::render('Waiter/Counter', [
            ...$this->loadCatalogData(posOnly: true),
            'cashRegisterOpen' => $cashRegisterOpen,
            'userName' => Auth::user()?->name ?? 'Garçom',
        ]);
    }

    public function storeCounterOrder(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.id' => 'nullable|string',
            'items.*.type' => 'required|in:product,pizza_flavor,pizza_custom',
            'items.*.quantity' => 'required|integer|min:1|max:50',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.size_id' => 'required_if:items.*.type,pizza_custom|nullable|uuid|exists:pizza_sizes,id',
            'items.*.flavor_ids' => 'required_if:items.*.type,pizza_custom|nullable|array|min:1',
            'items.*.flavor_ids.*' => 'uuid|exists:pizza_flavors,id',
            'items.*.border_id' => 'nullable|uuid|exists:products,id',
            'items.*.observation' => 'nullable|string|max:500',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'pay_now' => 'required|boolean',
            'payments' => 'required_if:pay_now,true|array',
            'payments.*.method' => 'required_with:payments|string|in:dinheiro,pix,credito,debito',
            'payments.*.amount' => 'required_with:payments|numeric|min:0.01',
        ]);

        try {
            $payNow = (bool) $validated['pay_now'];
            $order = $this->createCounterOrderAction->execute($validated, $request->user(), $payNow);

            $statusLabel = $payNow ? 'pago na hora' : 'enviado para pagamento no caixa';

            return redirect()->back()->with(
                'success',
                "Pedido Balcão #{$order->short_code} lançado ({$statusLabel})!"
            );
        } catch (OrderActionException $exception) {
            return redirect()->back()->with('error', $exception->getMessage());
        } catch (\Throwable $e) {
            Log::error('Error creating counter order from waiter app', [
                'exception' => $e,
                'user_id' => Auth::id(),
            ]);

            return redirect()->back()->with('error', __('common.error.unexpected'));
        }
    }

    public function orders()
    {
        $user = Auth::user();
        $orders = Order::where(function ($query) {
            $query->whereIn('status', ['pending', 'preparing', 'ready'])
                ->orWhere(function ($sub) {
                    $sub->where('type', 'pickup')
                        ->whereNull('paid_at')
                        ->whereNotIn('status', ['cancelled', 'rejected', 'completed']);
                });
        })
            ->with(['items.product', 'items.pizzaSize', 'items.flavors', 'table'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($o) {
                $gross = (float) $o->total_amount;
                $serviceFee = round(($o->service_fee_amount ?? 0) / 100, 2);
                $discount = round(($o->discount_amount ?? 0) / 100, 2);

                return [
                    'id' => $o->id,
                    'short_code' => $o->short_code,
                    'status' => $o->status,
                    'type' => $o->type,
                    'is_paid' => $o->paid_at !== null,
                    'customer_name' => $o->customer_name ?? 'Cliente',
                    'total' => max(0.0, round($gross + $serviceFee - $discount, 2)),
                    'discount_amount' => $discount,
                    'table_id' => $o->table_id,
                    'table_name' => $o->table?->name ?? 'Balcão',
                    'created_at' => $o->created_at->format('H:i'),
                    'elapsed_minutes' => (int) $o->created_at->diffInMinutes(now()),
                    'items_count' => $o->items->sum('quantity'),
                    'notes' => $o->notes,
                    'items' => $o->items->map(function ($item) {
                        $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true) || $item->pizzaSize !== null || $item->flavors->isNotEmpty();
                        $sizeName = $item->pizzaSize?->name;
                        $flavors = $item->flavors;
                        $flavorCount = $flavors->count();
                        $name = $item->product
                            ? $item->product->name
                            : ($sizeName
                                ? 'Pizza '.$sizeName.($flavorCount > 0 ? ' ('.$flavors->pluck('name')->join(', ').')' : '')
                                : ($item->description ?: 'Item Customizado'));

                        return [
                            'id' => $item->id,
                            'quantity' => $item->quantity,
                            'name' => $name,
                            'total_price' => (float) $item->subtotal,
                            'notes' => \App\Application\Printing\OrderItemClassifier::cleanNotes(
                                rawCustom: $item->description,
                                rawNotes: $item->notes,
                                itemName: $item->product?->name,
                                productName: $item->product?->name,
                                isPizza: $isPizza,
                                sizeName: $sizeName
                            ),
                            'flavors_detail' => $flavors->map(fn ($f) => [
                                'name' => $f->name,
                                'ingredients' => $f->ingredients,
                                'fraction' => $flavorCount > 1 ? "1/{$flavorCount}" : '1/1',
                            ])->values()->all(),
                        ];
                    })->values()->all(),
                ];
            });

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

    /**
     * Load shared product/pizza catalog props for Waiter tables and counter sales.
     *
     * @return array<string, mixed>
     */
    private function loadCatalogData(bool $posOnly): array
    {
        $productQuery = Product::whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->orderBy('name');

        $categoryQuery = Product::select('category')
            ->distinct()
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras']);

        if ($posOnly) {
            $productQuery->where('is_active_pos', true);
            $categoryQuery->where('is_active_pos', true);
        }

        $products = $productQuery->get()->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'price' => (float) $p->price,
            'category' => $p->category,
            'image_url' => $p->image_url,
            'variations' => $p->variations,
            'type' => 'product',
        ]);

        $pizzaFlavorsQuery = PizzaFlavor::orderBy('name');
        $pizzaFlavorsQuery->where($posOnly ? 'is_active_pos' : 'is_active', true);

        $pizzaFlavors = $pizzaFlavorsQuery
            ->get()
            ->map(fn (PizzaFlavor $flavor) => $flavor->toStaffBuilderArray());

        $categories = $categoryQuery->pluck('category')->toArray();
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

        return [
            'products' => $products,
            'pizzaFlavors' => $pizzaFlavors,
            'pizzaSizes' => $pizzaSizes,
            'categories' => $categories,
            'borderOptions' => $borderOptions,
        ];
    }
}
