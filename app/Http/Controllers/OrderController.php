<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\CancelOrDeleteOrderAction;
use App\Application\Orders\OrderActionException;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(
        private readonly CancelOrDeleteOrderAction $cancelOrDeleteOrderAction,
        private readonly CashRegisterLockService $cashRegisterLockService,
    ) {}

    /**
     * Display the orders list page.
     */
    public function index()
    {
        $orders = Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'payments', 'table', 'user', 'neighborhood'])
            ->orderByDesc('updated_at')
            ->paginate(20)
            ->through(fn ($order) => [
                'id' => $order->id,
                'short_code' => $order->short_code,
                'status' => $order->status,
                'type' => $order->type,
                'is_paid' => $order->paid_at !== null,
                'customer_name' => $order->customer_name ?? 'Cliente',
                'customer_phone' => $order->customer_phone,
                'delivery_address' => $order->delivery_address,
                'delivery_complement' => $order->delivery_complement,
                'neighborhood' => $order->neighborhood_name ?? ($order->neighborhood?->name),
                'total_amount' => (float) $order->total_amount,
                'items_count' => $order->items->sum('quantity'),
                'payments' => $order->payments->map(fn($p) => [
                    'method' => $p->method,
                    'amount' => (float) $p->amount,
                ]),
                'table_name' => $order->table?->name ?? null,
                'created_at' => $order->created_at->format('d/m/Y H:i'),
                'created_at_relative' => $order->created_at->diffForHumans(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'name' => $item->product ? $item->product->name : ($item->pizzaSize ? 'Pizza '.$item->pizzaSize->name.' ('.$item->flavors->pluck('name')->join(', ').')' : 'Item Customizado'),
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->subtotal,
                    'notes' => $item->notes,
                    'description' => $item->description,
                ]),
            ]);

        // Stats
        $stats = [
            'total_today' => Order::whereDate('created_at', today())->count(),
            'revenue_today' => ((float) Order::whereDate('paid_at', today())->sum('total_amount')) / 100,
            'pending_count' => Order::whereIn('status', ['pending', 'preparing', 'ready'])->count(),
            'completed_today' => Order::whereDate('paid_at', today())->count(),
        ];

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
        ]);
    }

    public function destroyWithPin(Request $request, Order $order): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
            'reason' => ['nullable', 'string', 'max:255'],
        ], [
            'pin.required' => 'Informe o código PIN de 4 dígitos.',
            'pin.regex' => 'O código PIN deve conter exatamente 4 dígitos.',
        ]);

        try {
            $this->cancelOrDeleteOrderAction->deleteOrder(
                order: $order,
                pin: $validated['pin'],
                actor: $request->user(),
                reason: $validated['reason'] ?? null,
            );

            $message = "Pedido #{$order->short_code} apagado com sucesso.";

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
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

    public function destroyItemWithPin(Request $request, Order $order, OrderItem $item): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
            'reason' => ['nullable', 'string', 'max:255'],
        ], [
            'pin.required' => 'Informe o código PIN de 4 dígitos.',
            'pin.regex' => 'O código PIN deve conter exatamente 4 dígitos.',
        ]);

        try {
            $result = $this->cancelOrDeleteOrderAction->deleteOrderItem(
                order: $order,
                item: $item,
                pin: $validated['pin'],
                actor: $request->user(),
                reason: $validated['reason'] ?? null,
            );

            $message = $result['order_deleted']
                ? "Último item removido e pedido #{$order->short_code} apagado."
                : 'Item removido do pedido com sucesso.';

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'order_deleted' => $result['order_deleted'],
                    'new_total' => $result['new_total'],
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

    public function receivePayment(Request $request, Order $order): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.method' => ['required', 'string', 'in:dinheiro,pix,credito,debito'],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        try {
            $activeRegister = $this->cashRegisterLockService->requireOpenRegister();

            DB::transaction(function () use ($order, $validated, $activeRegister): void {
                /** @var Order $lockedOrder */
                $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

                if ($lockedOrder->paid_at !== null) {
                    throw new OrderActionException('Este pedido já está pago.', 422);
                }

                if (in_array($lockedOrder->status, ['cancelled', 'rejected'], true)) {
                    throw new OrderActionException('Não é possível receber pagamento de pedido cancelado.', 422);
                }

                $totalAmount = (float) $lockedOrder->total_amount;
                $totalPaid = collect($validated['payments'])->sum(fn (array $p) => (float) $p['amount']);

                if ($totalPaid < ($totalAmount - 0.01)) {
                    throw new OrderActionException('Valor pago insuficiente para quitar o pedido.', 422);
                }

                foreach ($validated['payments'] as $paymentData) {
                    Payment::create([
                        'order_id' => $lockedOrder->id,
                        'method' => (string) $paymentData['method'],
                        'amount' => (float) $paymentData['amount'],
                        'paid_at' => now(),
                    ]);
                }

                $changeAmount = max(0.0, round($totalPaid - $totalAmount, 2));
                $previousStatus = (string) $lockedOrder->status;
                $newStatus = $lockedOrder->status === Order::STATUS_DELIVERED
                    ? Order::STATUS_COMPLETED
                    : $previousStatus;

                $lockedOrder->update([
                    'paid_at' => now(),
                    'cash_register_id' => $activeRegister->id,
                    'change_amount' => $changeAmount,
                    'status' => $newStatus,
                ]);

                Cache::forget('dashboard_stats');

                $orderId = $lockedOrder->id;
                $orderType = (string) $lockedOrder->type;
                $tableId = $lockedOrder->table_id;

                DB::afterCommit(function () use ($orderId, $newStatus, $previousStatus, $orderType, $tableId): void {
                    try {
                        event(new OrderStatusUpdated(
                            orderId: $orderId,
                            status: $newStatus,
                            previousStatus: $previousStatus,
                            type: $orderType,
                            tableId: $tableId,
                        ));
                    } catch (\Throwable $e) {
                        Log::warning('Broadcast failed after order payment reception: '.$e->getMessage());
                    }
                });
            });

            $message = 'Pagamento registrado com sucesso!';

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                ]);
            }

            return redirect()->back()->with('success', $message);
        } catch (OrderActionException $exception) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $exception->getMessage(),
                ], $exception->getStatus());
            }

            return redirect()->back()->with('error', $exception->getMessage());
        }
    }
}
