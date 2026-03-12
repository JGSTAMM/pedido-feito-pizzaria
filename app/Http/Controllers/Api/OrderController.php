<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;
use App\Services\PizzaPriceService;
use App\Services\PrintService;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected $priceService;

    public function __construct(PizzaPriceService $priceService)
    {
        $this->priceService = $priceService;
    }

    public function store(Request $request)
    {
        $caixaAberto = \App\Models\CashRegister::where('status', 'open')->exists();
        if (!$caixaAberto) {
            return response()->json([
                'message' => 'Operação bloqueada: O caixa está fechado. Peça ao gerente para abrir o caixa.'
            ], 403);
        }

        $validated = $request->validate([
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array',
            'items.*.type' => 'required|in:pizza,product',
            'items.*.notes' => 'nullable|string|max:255',
            // Pizza validation
            'items.*.size_id' => 'required_if:items.*.type,pizza|exists:pizza_sizes,id',
            'items.*.flavor_ids' => 'required_if:items.*.type,pizza|array',
            'items.*.flavor_ids.*' => 'exists:pizza_flavors,id',
            // Product validation
            'items.*.product_id' => 'required_if:items.*.type,product|exists:products,id',
            'items.*.quantity' => 'required_if:items.*.type,product|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $order = Order::create([
                'table_id' => $validated['table_id'],
                'user_id' => $request->user()->id,
                'status' => 'preparing', // Orders from waiter go directly to kitchen
                'type' => 'salon',
                'total_amount' => 0,
            ]);

            // Update table status to occupied
            Table::where('id', $validated['table_id'])->update(['status' => 'occupied']);

            $totalAmount = 0;

            foreach ($validated['items'] as $item) {
                $notes = $item['notes'] ?? null;

                if ($item['type'] === 'pizza') {
                    $sizeId = $item['size_id'];
                    $flavorIds = $item['flavor_ids'];

                    $price = $this->priceService->calculateItemPrice($sizeId, $flavorIds);

                    $orderItem = OrderItem::create([
                        'order_id' => $order->id,
                        'pizza_size_id' => $sizeId,
                        'quantity' => 1,
                        'unit_price' => $price,
                        'subtotal' => $price,
                        'type' => 'pizza',
                        'notes' => $notes,
                    ]);

                    // Attach flavors
                    $fraction = '1/' . count($flavorIds);
                    $attachData = [];
                    foreach ($flavorIds as $flavorId) {
                        $attachData[$flavorId] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'fraction' => $fraction
                        ];
                    }
                    $orderItem->flavors()->attach($attachData);

                    $totalAmount += $price;
                } elseif ($item['type'] === 'product') {
                    $product = Product::find($item['product_id']);
                    $quantity = $item['quantity'];
                    $price = $product->price * $quantity;

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity' => $quantity,
                        'unit_price' => $product->price,
                        'subtotal' => $price,
                        'type' => 'product',
                        'notes' => $notes,
                    ]);

                    $totalAmount += $price;
                }
            }

            $order->update(['total_amount' => $totalAmount]);

            DB::commit();

            // Auto-print kitchen ticket if enabled
            if (config('printing.auto_print_kitchen')) {
                $printService = new PrintService();
                $printService->printKitchenTicket($order);
            }

            return response()->json([
                'message' => 'Order created',
                'order_id' => $order->id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get active orders for a table (for waiter order checking)
     */
    public function getByTable($tableId)
    {
        $orders = Order::with(['items.product', 'items.pizzaSize', 'items.flavors'])
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled', 'paid'])
            ->orderBy('created_at', 'desc')
            ->get();

        $result = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'created_at' => $order->created_at->format('H:i'),
                'items' => $order->items->map(function ($item) {
                    if ($item->pizzaSize) {
                        return [
                            'type' => 'pizza',
                            'name' => 'Pizza ' . $item->pizzaSize->name,
                            'flavors' => $item->flavors->pluck('name')->join(' / '),
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                        ];
                    } else {
                        return [
                            'type' => 'product',
                            'name' => $item->product?->name ?? 'Item',
                            'flavors' => null,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                        ];
                    }
                }),
            ];
        });

        return response()->json([
            'orders' => $result,
            'total_table' => $orders->sum('total_amount'),
        ]);
    }

    /**
     * Get all active orders (for comandas screen)
     */
    public function getAllActive()
    {
        $orders = Order::with(['table', 'items.product', 'items.pizzaSize', 'items.flavors'])
            ->whereDate('created_at', now()->toDateString())
            ->orderBy('created_at', 'desc')
            ->get();

        $result = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'table_name' => $order->table?->name ?? 'Balcão',
                'table_id' => $order->table_id,
                'status' => $order->status,
                'total_amount' => $order->total_amount,
                'created_at' => $order->created_at->format('H:i'),
                'items' => $order->items->map(function ($item) {
                    if ($item->pizzaSize) {
                        return [
                            'type' => 'pizza',
                            'name' => 'Pizza ' . $item->pizzaSize->name,
                            'flavors' => $item->flavors->pluck('name')->join(' / '),
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                            'notes' => $item->notes,
                        ];
                    } else {
                        return [
                            'type' => 'product',
                            'name' => $item->product?->name ?? 'Item',
                            'flavors' => null,
                            'quantity' => $item->quantity,
                            'subtotal' => $item->subtotal,
                            'notes' => $item->notes,
                        ];
                    }
                }),
            ];
        });

        return response()->json([
            'orders' => $result,
        ]);
    }

    /**
     * Get orders with status 'ready' (for waiter app notifications)
     */
    public function getReady()
    {
        $orders = Order::with(['table', 'items.product', 'items.pizzaSize', 'items.flavors'])
            ->where('status', 'ready')
            ->whereDate('created_at', today())
            ->orderBy('ready_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'short_code' => $order->short_code,
                    'table' => $order->table?->name ?? 'Balcão',
                    'table_id' => $order->table_id,
                    'type' => $order->type,
                    'customer_name' => $order->customer_name,
                    'total_amount' => $order->total_amount,
                    'ready_at' => $order->ready_at?->format('H:i'),
                    'items_count' => $order->items->count(),
                ];
            });

        return response()->json(['orders' => $orders]);
    }

    /**
     * Close a table (mark all active orders as completed, release table)
     */
    public function closeTable(Table $table)
    {
        $activeOrders = Order::where('table_id', $table->id)
            ->whereNotIn('status', ['completed', 'paid', 'cancelled'])
            ->get();

        if ($activeOrders->isEmpty()) {
            return response()->json(['message' => 'Nenhum pedido ativo nesta mesa'], 404);
        }

        foreach ($activeOrders as $order) {
            $order->update(['status' => 'completed']);
        }

        $table->update(['status' => 'available']);

        return response()->json([
            'message' => 'Mesa fechada com sucesso',
            'orders_closed' => $activeOrders->count(),
        ]);
    }

    /**
     * Pay and close table
     */
    public function payAndCloseTable(Request $request, Table $table)
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
            return response()->json(['message' => 'Nenhum pedido ativo'], 404);
        }

        $totalAmount = $orders->sum('total_amount');
        $totalPaid = collect($validated['payments'])->sum('amount');

        // Allow small floating point difference or check exact?
        // Let's enforce totalPaid >= totalAmount
        if ($totalPaid < $totalAmount - 0.01) {
             return response()->json(['message' => 'Valor pago insuficiente'], 400);
        }

        // Find active cash register for this user (waiter)
        $activeRegister = \App\Models\CashRegister::where('user_id', $request->user()->id)
            ->where('status', 'open')
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
                    $currentMethod = &$paymentPool[$pIndex]; // Reference to modify amount
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
                            // Calculate change amount on order? 
                            // Order model has change_amount.
                            // We can sum up all payments for this order and subtract total_amount.
                            // But let's leave as is for now, standardizing on Payment records.
                        }
                        $pIndex++;
                     }
                }

                // Update order
                $order->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'cash_register_id' => $activeRegister?->id,
                ]);
            }

            $table->update(['status' => 'available']);

            DB::commit();
            return response()->json(['message' => 'Mesa paga e fechada com sucesso']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erro ao processar pagamento: ' . $e->getMessage()], 500);
        }
    }
}
