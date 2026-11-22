<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\CancelOrDeleteOrderAction;
use App\Application\Orders\OrderActionException;
use App\Application\Printing\PrintQueueService;
use App\Events\OrderCreated;
use App\Events\OrderCreatedForPrinting;
use App\Events\OrderStatusUpdated;
use App\Events\TableBillPrintRequested;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use App\Services\PizzaPriceService;
use App\Services\PaymentGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Application\Orders\SettleTableModule;
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
        private readonly SettleTableModule $settleTableModule,
        private readonly PrintQueueService $printQueueService,
        private readonly CancelOrDeleteOrderAction $cancelOrDeleteOrderAction,
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
                                'price' => (float) $item->unit_price,
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
                        'table_name' => $table->name,
                        'customer_name' => $first->customer_name ?? 'Cliente',
                        'total' => (float) $activeOrders->sum('total_amount'),
                        'status' => $first->status,
                        'created_at_time' => $first->created_at->format('H:i'),
                        'elapsed_minutes' => (int) $first->created_at->diffInMinutes(now()),
                        'ready_at_time' => $first->ready_at?->format('H:i'),
                        'lead_time' => $first->ready_at ? (int) $first->created_at->diffInMinutes($first->ready_at) : null,
                        'items' => $activeOrders->flatMap(function ($order) {
                            return $order->items->map(function ($item) {
                                $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true);
                                $name = $isPizza
                                    ? ($item->pizzaSize?->name ? "PIZZA {$item->pizzaSize->name}" : 'PIZZA')
                                    : ($item->product?->name ?? $item->description ?? 'Item');

                                return [
                                    'id' => $item->id,
                                    'quantity' => $item->quantity,
                                    'name' => $name,
                                    'price' => (float) $item->unit_price,
                                    'unit_price' => (float) $item->unit_price,
                                    'subtotal' => (float) $item->subtotal,
                                    'type' => $item->type ?? 'product',
                                    'is_pizza' => $isPizza,
                                    'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                                    'flavor_names' => $isPizza ? $item->flavors->pluck('name')->values()->toArray() : [],
                                    'notes' => $item->notes ?? null,
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
            ->map(fn (PizzaFlavor $flavor) => $flavor->toStaffBuilderArray());

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
                        $borderProd = Product::where('id', $borderId)
                            ->where('category', 'Extras')
                            ->where('is_active_pos', true)
                            ->first();
                        if ($borderProd) {
                            $unitPrice += (float) $borderProd->price;
                            $borderName = $borderProd->name;
                        }
                    }

                    $size = PizzaSize::find($sizeId);
                    $flavors = PizzaFlavor::whereIn('id', $flavorIds)->pluck('name')->toArray();
                    $sizeName = $size ? $size->name : 'Pizza';
                    $description = "Pizza {$sizeName}";

                    if ($borderName && (! $customerObs || ! str_contains(mb_strtolower($customerObs), 'borda:'))) {
                        $customerObs = $customerObs ? "Borda: {$borderName} | {$customerObs}" : "Borda: {$borderName}";
                    }

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

            $cleanTableName = trim((string) $table->name);
            $customerTableLabel = preg_match('/^mesa\b/i', $cleanTableName) ? $cleanTableName : 'Mesa '.$cleanTableName;

            // ALWAYS create new dine_in order for this table to avoid "infinite order" bug in kitchen
            $order = Order::create([
                'status' => 'pending',
                'type' => 'dine_in',
                'total_amount' => $totalAmount,
                'customer_name' => $customerTableLabel,
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

            // Enqueue kitchen ticket in print queue FIRST so Reverb unavailability never blocks printing
            try {
                $this->printQueueService->enqueueKitchenTicket($order);
            } catch (\Throwable $queueEx) {
                Log::warning('Failed to enqueue kitchen print job for floor order: '.$queueEx->getMessage());
            }

            // Broadcast real-time event so KDS picks up this dine-in order instantly
            try {
                event(new OrderCreated(
                    orderId: $order->id,
                    status: 'pending',
                    type: 'dine_in',
                    shortCode: $order->short_code ?? '',
                    tableId: $table->id,
                ));
            } catch (\Throwable $broadcastEx) {
                Log::warning('Broadcast failed after floor order creation: '.$broadcastEx->getMessage());
            }

            try {
                event(new OrderCreatedForPrinting($order->id));
            } catch (\Throwable $printException) {
                Log::warning('Automatic thermal printing dispatch failed after floor order creation.', [
                    'order_id' => $order->id,
                    'error' => $printException->getMessage(),
                ]);
            }

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
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|string|in:dinheiro,pix,pix_balcao,credito,debito',
            'payments.*.amount' => 'required|integer|min:0',
            'service_fee_cents' => 'nullable|integer|min:0',
            'discount_cents' => 'nullable|integer|min:0',
            'discount_supervisor_id' => 'nullable|exists:users,id',
            'discount_supervisor_pin' => ['nullable', 'string', 'regex:/^\d{4}$/'],
        ]);

        $discountCents = (int) ($validated['discount_cents'] ?? 0);
        $approvedSupervisorId = null;

        if ($discountCents > 0) {
            if (! empty($validated['discount_supervisor_pin'])) {
                $pinCheck = $this->cancelOrDeleteOrderAction->verifySupervisorPin((string) $validated['discount_supervisor_pin']);
                if (! $pinCheck['valid'] || ! $pinCheck['supervisor']) {
                    return redirect()->back()->with('error', 'PIN de supervisor inválido ou não configurado para aplicar desconto.');
                }
                $approvedSupervisorId = $pinCheck['supervisor']->id;
            } elseif ($request->hasSession()) {
                $approval = $request->session()->get('floor_discount_approval');
                if (is_array($approval) && ($approval['expires_at'] ?? 0) >= now()->timestamp && ! empty($approval['supervisor_id'])) {
                    $supervisor = \App\Models\User::find($approval['supervisor_id']);
                    $expectedDigest = (string) ($approval['pin_digest'] ?? '');
                    if (
                        $supervisor
                        && in_array(strtolower(trim((string) $supervisor->role)), ['admin', 'supervisor'], true)
                        && ! empty($supervisor->pin_hash)
                        && hash_equals(hash('sha256', (string) $supervisor->pin_hash), $expectedDigest)
                    ) {
                        $approvedSupervisorId = $supervisor->id;
                    }
                }
                $request->session()->forget('floor_discount_approval');
            }

            if (empty($approvedSupervisorId)) {
                return redirect()->back()->with('error', 'Desconto exige autorização de um supervisor com PIN válido.');
            }
        } elseif ($request->hasSession()) {
            $request->session()->forget('floor_discount_approval');
        }

        try {
            $this->settleTableModule->execute(
                table: $table,
                payments: $validated['payments'],
                settledBy: $request->user(),
                options: [
                    'amounts_in_cents' => true,
                    'service_fee_cents' => $validated['service_fee_cents'] ?? 0,
                    'discount_cents' => $discountCents,
                    'discount_supervisor_id' => $approvedSupervisorId,
                ]
            );

            return redirect()->back()->with('success', __('order.payment.success'));
        } catch (OrderActionException $exception) {
            return redirect()->back()->with('error', $exception->getMessage());
        } catch (\Exception $e) {
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
        $amount = round((float) $validated['amount'], 2);

        $tableTotal = round((float) $activeOrders->sum('total_amount'), 2);
        if ($amount > ($tableTotal * 1.5 + 1.00)) {
            return response()->json(['error' => 'Valor do PIX excede o limite esperado para esta mesa.'], 422);
        }

        // Generate standalone Mercado Pago PIX QR Code without mutating an existing order's payment_gateway_id
        $result = $this->paymentGatewayService->createStandalonePixPayment(
            amount: $amount,
            description: "Mesa {$table->name} - Pedido Feito Pizzaria",
            payerEmail: 'pagamento@pedidofeito.com',
        );

        if (! ($result['success'] ?? false)) {
            return response()->json(['error' => $result['error'] ?? 'Erro ao gerar PIX'], 500);
        }

        $gatewayPaymentId = (string) $result['data']['gateway_payment_id'];
        if ($request->hasSession()) {
            $floorPixMap = (array) $request->session()->get('floor_pix_payments', []);
            $floorPixMap[$firstOrder->id] = [
                'gateway_payment_id' => $gatewayPaymentId,
                'amount' => $amount,
                'table_id' => $table->id,
            ];
            $request->session()->put('floor_pix_payments', array_slice($floorPixMap, -20, null, true));
        }

        // Return QR Details
        return response()->json([
            'success' => true,
            'qr_code' => $result['data']['qr_code'],
            'qr_code_base64' => $result['data']['qr_code_base64'],
            'gateway_payment_id' => $gatewayPaymentId,
            'expires_at' => $result['data']['expires_at'],
            'order_id' => $firstOrder->id,
        ]);
    }

    /**
     * Polling endpoint to check Floor PIX payment status directly with currency & amount validation.
     */
    public function pixPaymentStatus(Request $request, Order $order)
    {
        if (empty($order->table_id)) {
            return response()->json(['error' => 'Order does not belong to a floor table.'], 403);
        }

        $floorPixMap = $request->hasSession() ? (array) $request->session()->get('floor_pix_payments', []) : [];
        $sessionPix = $floorPixMap[$order->id] ?? null;

        if (is_array($sessionPix) && ! empty($sessionPix['gateway_payment_id'])) {
            $expectedAmount = (float) ($sessionPix['amount'] ?? 0);
            $verified = $this->paymentGatewayService->verifyApprovedGatewayPayment(
                (string) $sessionPix['gateway_payment_id'],
                $expectedAmount
            );

            return response()->json([
                'status' => $verified['approved'] ? 'approved' : ($verified['status'] ?? 'pending'),
            ]);
        }

        if ($order->online_payment_status === 'approved') {
            return response()->json(['status' => 'approved']);
        }

        if (empty($order->payment_gateway_id)) {
            return response()->json(['status' => 'pending']);
        }

        $verified = $this->paymentGatewayService->verifyApprovedGatewayPayment(
            (string) $order->payment_gateway_id,
            (float) $order->total_amount
        );

        if ($verified['approved']) {
            $this->paymentGatewayService->handleWebhook([
                'type' => 'payment',
                'data' => ['id' => (string) $order->payment_gateway_id],
            ]);

            return response()->json(['status' => 'approved']);
        }

        return response()->json(['status' => $verified['status'] ?? 'pending']);
    }

    /**
     * Validate Supervisor PIN for Discounts
     */
    public function validateSupervisorPin(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ]);

        $check = $this->cancelOrDeleteOrderAction->verifySupervisorPin((string) $request->pin);

        if (! $check['valid'] || ! $check['supervisor']) {
            if (($check['reason'] ?? null) === 'too_many_attempts') {
                return response()->json([
                    'valid' => false,
                    'reason' => 'too_many_attempts',
                ], 429);
            }

            return response()->json([
                'valid' => false,
                'reason' => $check['reason'] ?? 'invalid_pin',
            ], 401);
        }

        $supervisor = $check['supervisor'];

        if ($request->hasSession()) {
            $request->session()->put('floor_discount_approval', [
                'supervisor_id' => $supervisor->id,
                'supervisor_name' => $supervisor->name,
                'pin_digest' => hash('sha256', (string) $supervisor->pin_hash),
                'expires_at' => now()->addMinutes(5)->timestamp,
            ]);
        }

        return response()->json([
            'valid' => true,
            'supervisor_name' => $supervisor->name,
            'supervisor_id' => $supervisor->id,
        ]);
    }

    /**
     * Dispatch Table Bill Printing (for thermal printers via WebSocket or local).
     */
    public function printBill(Table $table): JsonResponse
    {
        $activeOrders = $table->activeOrders()->with(['items.product', 'items.pizzaSize', 'items.flavors'])->get();
        if ($activeOrders->isEmpty()) {
            return response()->json(['error' => __('order.payment.no_active_orders')], 400);
        }

        $first = $activeOrders->first();
        $summaryOrder = [
            'id' => $first->id,
            'short_code' => $first->short_code,
            'table_name' => $table->name,
            'customer_name' => $first->customer_name ?? 'Cliente',
            'total' => (float) $activeOrders->sum('total_amount'),
            'status' => $first->status,
            'created_at_time' => $first->created_at->format('H:i'),
            'elapsed_minutes' => (int) $first->created_at->diffInMinutes(now()),
            'items' => $activeOrders->flatMap(function ($order) {
                return $order->items->map(function ($item) {
                    $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true);
                    $name = $isPizza
                        ? ($item->pizzaSize?->name ? "PIZZA {$item->pizzaSize->name}" : 'PIZZA')
                        : ($item->product?->name ?? $item->description ?? 'Item');

                    return [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'name' => $name,
                        'price' => (float) $item->unit_price,
                        'unit_price' => (float) $item->unit_price,
                        'subtotal' => (float) $item->subtotal,
                        'type' => $item->type ?? 'product',
                        'is_pizza' => $isPizza,
                        'size_name' => $isPizza ? ($item->pizzaSize?->name ?? null) : null,
                        'flavor_names' => $isPizza ? $item->flavors->pluck('name')->values()->toArray() : [],
                        'notes' => $item->notes ?? null,
                    ];
                });
            })->values()->toArray(),
        ];

        $job = null;
        try {
            $job = $this->printQueueService->enqueueTableBill($table);
        } catch (\Throwable $billEx) {
            Log::warning('Failed to enqueue table bill print job: '.$billEx->getMessage());
        }

        try {
            event(new TableBillPrintRequested($table->id, $table->name, $summaryOrder));
        } catch (\Throwable $broadcastEx) {
            Log::warning('Broadcast failed for table bill print: '.$broadcastEx->getMessage());
        }

        $agentStatus = $this->printQueueService->getAgentStatus();

        return response()->json([
            'success' => true,
            'order' => $summaryOrder,
            'job_id' => $job?->id,
            'agent_online' => $agentStatus['is_online'],
        ]);
    }

    /**
     * Cancel/delete all active orders for a table (full comanda) with mandatory supervisor PIN.
     */
    public function clearComanda(Request $request, Table $table): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
            'reason' => ['nullable', 'string', 'max:255'],
        ], [
            'pin.required' => 'Informe o código PIN de 4 dígitos.',
            'pin.regex' => 'O código PIN deve conter exatamente 4 dígitos.',
        ]);

        try {
            $result = $this->cancelOrDeleteOrderAction->clearTableComanda(
                table: $table,
                pin: $validated['pin'],
                actor: $request->user(),
                reason: $validated['reason'] ?? null,
            );

            $message = "Comanda da {$table->name} apagada ({$result['deleted_count']} pedido(s)).";

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'deleted_count' => $result['deleted_count'],
                    'message' => $message,
                ]);
            }

            return redirect()->back()->with('success', $message);
        } catch (OrderActionException $exception) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'valid' => false,
                    'reason' => $exception->getReason(),
                    'message' => $exception->getMessage(),
                ], $exception->getStatus());
            }

            return redirect()->back()->with('error', $exception->getMessage());
        }
    }
}
