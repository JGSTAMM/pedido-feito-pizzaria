<?php

namespace App\Http\Controllers\Api;

use App\Application\Orders\CreateOrderAction;
use App\Application\Orders\OrderActionException;
use App\Application\Orders\PayAndCloseTableAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Table;

class OrderController extends Controller
{
    protected CreateOrderAction $createOrderAction;
    protected PayAndCloseTableAction $payAndCloseTableAction;

    public function __construct(
        CreateOrderAction $createOrderAction,
        PayAndCloseTableAction $payAndCloseTableAction
    )
    {
        $this->createOrderAction = $createOrderAction;
        $this->payAndCloseTableAction = $payAndCloseTableAction;
    }

    public function store(Request $request)
    {
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
            $order = $this->createOrderAction->execute($validated, $request->user());

            return response()->json([
                'message' => __('order.create.success'),
                'order_id' => $order->id
            ], 201);
        } catch (OrderActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
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

        try {
            $this->payAndCloseTableAction->execute($table, $validated['payments'], $request->user());

            return response()->json(['message' => __('order.payment.success')]);
        } catch (OrderActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }
}
