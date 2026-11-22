<?php

namespace App\Http\Controllers\Api;

use App\Application\Orders\CreateOrderAction;
use App\Application\Orders\OrderActionException;
use App\Application\Orders\PayAndCloseTableAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Table;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected CreateOrderAction $createOrderAction;

    protected PayAndCloseTableAction $payAndCloseTableAction;

    public function __construct(
        CreateOrderAction $createOrderAction,
        PayAndCloseTableAction $payAndCloseTableAction
    ) {
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
            'items.*.flavor_ids' => 'required_if:items.*.type,pizza|array|min:1',
            'items.*.flavor_ids.*' => 'exists:pizza_flavors,id',
            'items.*.border' => 'nullable|string|in:cheddar,catupiry,chocolate',
            'items.*.border_id' => 'nullable|uuid|exists:products,id',
            // Product validation
            'items.*.product_id' => 'required_if:items.*.type,product|exists:products,id',
            'items.*.quantity' => 'required_if:items.*.type,product|integer|min:1',
        ]);

        try {
            $order = $this->createOrderAction->execute($validated, $request->user());

            return response()->json([
                'message' => __('order.create.success'),
                'order_id' => $order->id,
            ], 201);
        } catch (OrderActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    /**
     * Get active orders for a table (for waiter order checking)
     */
    public function getByTable(string $tableId)
    {
        $table = Table::findOrFail($tableId);
        $this->authorize('viewOrders', $table);

        $orders = $table->activeOrders()
            ->with(['items.product', 'items.pizzaSize', 'items.flavors'])
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
                            'name' => 'Pizza '.$item->pizzaSize->name,
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
            ->paginate(50);

        $result = $orders->getCollection()->map(function ($order) {
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
                            'name' => 'Pizza '.$item->pizzaSize->name,
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
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
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
     * Close a table without payment (requires supervisor PIN or admin privilege; cancels unpaid orders so cash register closure is not deadlocked)
     */
    public function closeTable(Request $request, Table $table)
    {
        $this->authorize('closeWithoutPayment', $table);

        $user = $request->user();
        $isAdmin = $user && strtolower(trim((string) $user->role)) === 'admin';

        if (! $isAdmin) {
            $pin = (string) $request->input('pin', '');
            $pinCheck = app(\App\Application\Orders\CancelOrDeleteOrderAction::class)->verifySupervisorPin($pin);
            if (! $pinCheck['valid']) {
                return response()->json([
                    'message' => 'Informe um PIN de supervisor válido para fechar uma mesa sem pagamento.',
                    'reason' => $pinCheck['reason'] ?? 'invalid_pin',
                ], ($pinCheck['reason'] ?? '') === 'too_many_attempts' ? 429 : 403);
            }
        }

        /** @var \Illuminate\Database\Eloquent\Collection<\App\Models\Order> $activeOrders */
        $activeOrders = $table->activeOrders()->get();

        if ($activeOrders->isEmpty()) {
            return response()->json(['message' => 'Nenhum pedido ativo nesta mesa'], 404);
        }

        foreach ($activeOrders as $order) {
            /** @var \App\Models\Order $order */
            if ($order->paid_at !== null || $order->isPaidOnline()) {
                $order->update(['status' => 'completed']);
            } else {
                $order->update([
                    'status' => 'cancelled',
                    'rejected_at' => now(),
                    'rejection_reason' => '[Mesa fechada sem pagamento via API por '.($user?->name ?? 'Sistema').']',
                ]);
            }
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
        $this->authorize('payAndClose', $table);

        $validated = $request->validate([
            'payments' => 'required|array',
            'payments.*.method' => 'required|string|in:dinheiro,pix,pix_balcao,credito,debito',
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
