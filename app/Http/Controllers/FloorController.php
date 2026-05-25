<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\OrderActionException;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use App\Services\PizzaPriceService;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FloorController extends Controller
{
    public function __construct(
        private readonly PizzaPriceService $pizzaPriceService,
        private readonly CashRegisterLockService $cashRegisterLockService,
        private readonly PaymentGatewayService $paymentGatewayService,
    ) {}

    public function index(): \Inertia\Response
    {
        $tables = Table::with(['activeOrders.items.product', 'activeOrders.items.pizzaSize', 'activeOrders.items.flavors'])
            ->get()
            ->map(function ($table) {
                /** @var \App\Models\Table $table */
                $activeOrders = $table->activeOrders;
                $hasActive = $activeOrders->isNotEmpty();

                $mappedOrders = $activeOrders->map(function ($order) {
                    $createdAt = $order->created_at;
                    $readyAt = $order->ready_at;
                    
                    return [
                        'id' => $order->id,
                        'short_code' => $order->short_code,
                        'total' => (float) $order->total_amount,
                        'status' => $order->status,
                        'created_at' => $createdAt->toIso8601String(),
                        'created_at_time' => $createdAt->format('H:i'),
                        'paid_at_time' => $order->paid_at?->format('H:i'),
                        'ready_at_time' => $readyAt?->format('H:i'),
                        'lead_time' => $readyAt ? (int) $createdAt->diffInMinutes($readyAt) : null,
                        'elapsed_minutes' => (int) $createdAt->diffInMinutes(now()),
                        'items' => $order->items->map(function ($item) {
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
                        })->values()->toArray(),
                    ];
                })->values()->toArray();

                $summaryOrder = null;
                if ($hasActive) {
                    $first = $activeOrders->first();
                    $summaryOrder = [
                        'id' => $first->id,
                        'short_code' => $first->short_code,
                        'total' => (float) $activeOrders->sum('total_amount'),
                        'status' => $first->status,
                        'created_at_time' => $first->created_at->format('H:i'),
                        'elapsed_minutes' => (int) $first->created_at->diffInMinutes(now()),
                        'ready_at_time' => $first->ready_at?->format('H:i'),
                        'lead_time' => $first->ready_at ? (int) $first->created_at->diffInMinutes($first->ready_at) : null,
                        'items' => $activeOrders->flatMap(function ($order) {
                            return $order->items->map(function ($item) {
                                return [
                                    'id' => $item->id,
                                    'quantity' => $item->quantity,
                                    'name' => $item->description ?? $item->product?->name ?? 'Item',
                                    'price' => (float) $item->unit_price,
                                    'subtotal' => (float) $item->subtotal,
                                ];
                            });
                        })->values()->toArray(),
                    ];
                }

                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'status' => $hasActive ? 'occupied' : 'free',
                    'seats' => $table->capacity ?? 4,
                    'active_orders' => $mappedOrders,
                    'active_order' => $summaryOrder,
                ];
            })->values();

        $stats = [
            'total' => $tables->count(),
            'free' => $tables->where('status', 'free')->count(),
            'occupied' => $tables->where('status', 'occupied')->count(),
        ];

        // ── Catalog Data (same as PosController) ──
        $products = Product::where('is_active_pos', true)
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'category' => $p->category,
                'image_url' => $p->image_url,
                'variations' => $p->variations,
                'type' => 'product',
            ]);

        $pizzaFlavors = PizzaFlavor::where('is_active_pos', true)
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
            ->where('is_active_pos', true)
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
        try {
            $activeRegister = $this->cashRegisterLockService->requireOpenRegister();
        } catch (OrderActionException $exception) {
            return redirect()->back()->withErrors(['error' => $exception->getMessage()]);
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
            $priceService = $this->pizzaPriceService;

            foreach ($validated['items'] as $item) {
                if ($item['type'] === 'product') {
                    $product = Product::findOrFail($item['id']);
                    $unitPrice = (float) $product->price;
                    $description = $product->name;
                    $observation = $item['observation'] ?? null;

                    // Check for variations in the JSON column
                    if ($observation && !empty($product->variations)) {
                        foreach ($product->variations as $variation) {
                            if ($variation['name'] === $observation) {
                                $unitPrice = (float) $variation['price'];
                                $description = "{$product->name} ({$variation['name']})";
                                break;
                            }
                        }
                    }

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
                        'description' => $description,
                        'notes' => $observation,
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

            // ALWAYS create new dine_in order for this table to avoid "infinite order" bug in kitchen
            $order = Order::create([
                'status' => 'pending',
                'type' => 'dine_in',
                'total_amount' => $totalAmount,
                'customer_name' => 'Mesa '.$table->name,
                'table_id' => $table->id,
                'cash_register_id' => $activeRegister?->id,
                'user_id' => Auth::id(),
            ]);

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

                if (! empty($data['flavor_ids'])) {
                    $fraction = '1/'.count($data['flavor_ids']);
                    foreach ($data['flavor_ids'] as $flavorId) {
                        $orderItem->flavors()->attach($flavorId, [
                            'id' => Str::uuid()->toString(),
                            'fraction' => $fraction,
                        ]);
                    }
                }
            }

            DB::commit();

            // Broadcast real-time event so KDS picks up this dine-in order instantly
            event(new OrderCreated(
                orderId: $order->id,
                status: 'pending',
                type: 'dine_in',
                shortCode: $order->short_code ?? '',
                tableId: $table->id,
            ));

            return redirect()->back()->with('success', "Itens enviados para a cozinha! Pedido #{$order->id}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error adding floor items', [
                'table_id' => $table->id,
                'exception' => $e,
            ]);

            return redirect()->back()->with('error', __('common.error.unexpected'));
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

        try {
            $activeRegister = $this->cashRegisterLockService->requireOpenRegister();
        } catch (OrderActionException $exception) {
            return redirect()->back()->with('error', $exception->getMessage());
        }

        DB::beginTransaction();
        try {
            // Get active orders with lock to prevent double-charging
            /** @var \Illuminate\Database\Eloquent\Collection<\App\Models\Order> $orders */
            $orders = $table->activeOrders()
                ->lockForUpdate()
                ->get();

            if ($orders->isEmpty()) {
                DB::rollBack();

                return redirect()->back()->with('error', __('order.payment.no_active_orders'));
            }

            $totalAmount = $orders->sum('total_amount');
            $totalPaid = collect($validated['payments'])->sum('amount');

            if ($totalPaid < $totalAmount - 0.01) {
                DB::rollBack();

                return redirect()->back()->with('error', __('order.payment.insufficient_amount'));
            }

            $paymentPool = collect($validated['payments'])->map(function ($p) {
                return ['method' => $p['method'], 'amount' => (float) $p['amount']];
            })->toArray();

            $pIndex = 0;

            foreach ($orders as $index => $order) {
                /** @var \App\Models\Order $order */
                $amountToPayForOrder = (float) $order->total_amount;

                // Distribute payment to this order
                while ($amountToPayForOrder > 0.001 && $pIndex < count($paymentPool)) {
                    $currentMethod = &$paymentPool[$pIndex];
                    if ($currentMethod['amount'] <= 0) {
                        $pIndex++;

                        continue;
                    }

                    $take = min($currentMethod['amount'], $amountToPayForOrder);

                    Payment::create([
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
                    while ($pIndex < count($paymentPool)) {
                        if ($paymentPool[$pIndex]['amount'] > 0.001) {
                            Payment::create([
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

                // Broadcast table-closure so Floor view deactivates the table in real-time
                event(new OrderStatusUpdated(
                    orderId: $order->id,
                    status: 'completed',
                    previousStatus: 'ready',
                    type: $order->type,
                    tableId: $table->id,
                ));
            }

            $table->update(['status' => 'available']);

            DB::commit();

            return redirect()->back()->with('success', __('order.payment.success'));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error paying and closing floor table', [
                'table_id' => $table->id,
                'exception' => $e,
            ]);

            return redirect()->back()->with('error', __('common.error.unexpected'));
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

    /**
     * Generate dynamic Mercado Pago PIX QR Code for table checkout.
     */
    public function generatePix(Request $request, Table $table)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        try {
            $this->cashRegisterLockService->requireOpenRegister();
        } catch (OrderActionException $exception) {
            return response()->json(['error' => $exception->getMessage()], 400);
        }

        $activeOrders = $table->activeOrders;
        if ($activeOrders->isEmpty()) {
            return response()->json(['error' => __('order.payment.no_active_orders')], 400);
        }

        $firstOrder = $activeOrders->first();
        $amount = (float) $validated['amount'];

        // Generate dynamic Mercado Pago PIX QR Code via PaymentGatewayService
        $result = $this->paymentGatewayService->createPixPayment($firstOrder, 'pagamento@pedidofeito.com', $amount);

        if (!($result['success'] ?? false)) {
            return response()->json(['error' => $result['error'] ?? 'Erro ao gerar PIX'], 500);
        }

        // Return QR Details
        return response()->json([
            'success' => true,
            'qr_code' => $result['data']['qr_code'],
            'qr_code_base64' => $result['data']['qr_code_base64'],
            'gateway_payment_id' => $result['data']['gateway_payment_id'],
            'expires_at' => $result['data']['expires_at'],
            'order_id' => $firstOrder->id,
        ]);
    }

    /**
     * Polling endpoint to check POS PIX payment status directly.
     */
    public function pixPaymentStatus(Order $order)
    {
        if ($order->online_payment_status === 'approved') {
            return response()->json(['status' => 'approved']);
        }

        $gatewayStatus = $this->paymentGatewayService->checkPaymentStatus($order);

        if ($gatewayStatus === 'approved') {
            $order->update(['online_payment_status' => 'approved']);
            return response()->json(['status' => 'approved']);
        }

        return response()->json(['status' => $gatewayStatus ?? 'pending']);
    }
}
