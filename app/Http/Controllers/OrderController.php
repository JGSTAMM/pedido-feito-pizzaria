<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\CancelOrDeleteOrderAction;
use App\Application\Orders\OrderActionException;
use App\Application\Printing\OrderItemClassifier;
use App\Application\Printing\PrintQueueService;
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
        private readonly PrintQueueService $printQueueService,
    ) {}

    /**
     * Display the orders list page.
     */
    public function index()
    {
        $orders = Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'payments', 'table', 'user', 'neighborhood'])
            ->orderByDesc('updated_at')
            ->paginate(20)
            ->through(function ($order) {
                $grossTotal = (float) $order->total_amount;
                $deliveryFee = (float) $order->delivery_fee;
                $serviceFee = round(($order->service_fee_amount ?? 0) / 100, 2);
                $discountAmount = round(($order->discount_amount ?? 0) / 100, 2);
                $netTotal = max(0.0, round($grossTotal + $deliveryFee + $serviceFee - $discountAmount, 2));

                $items = $order->items->map(function ($item) {
                    $isPizza = in_array($item->type, ['pizza', 'pizza_custom'], true) || $item->pizzaSize !== null || $item->flavors->isNotEmpty();
                    $sizeName = $item->pizzaSize?->name;
                    $flavors = $item->flavors;
                    $flavorCount = $flavors->count();
                    $name = $item->product
                        ? $item->product->name
                        : ($sizeName
                            ? 'Pizza '.$sizeName.($flavorCount > 0 ? ' ('.$flavors->pluck('name')->join(', ').')' : '')
                            : ($item->description ?: 'Item Customizado'));

                    $cleanDescription = OrderItemClassifier::cleanNotes(
                        rawCustom: $item->description,
                        rawNotes: null,
                        itemName: $name,
                        productName: $item->product?->name,
                        isPizza: $isPizza,
                        sizeName: $sizeName
                    );

                    $cleanNotes = OrderItemClassifier::cleanNotes(
                        rawCustom: null,
                        rawNotes: $item->notes,
                        itemName: $name,
                        productName: $item->product?->name,
                        isPizza: $isPizza,
                        sizeName: $sizeName
                    );

                    return [
                        'id' => $item->id,
                        'quantity' => $item->quantity,
                        'name' => $name,
                        'unit_price' => (float) $item->unit_price,
                        'total_price' => (float) $item->subtotal,
                        'notes' => $cleanNotes,
                        'description' => $cleanDescription,
                        'flavors_detail' => $flavors->map(fn ($f) => [
                            'name' => $f->name,
                            'ingredients' => $f->ingredients,
                            'fraction' => $flavorCount > 1 ? "1/{$flavorCount}" : '1/1',
                        ])->values()->all(),
                    ];
                })->values()->all();

                $itemsSummary = array_map(
                    fn (array $item) => "{$item['quantity']}x {$item['name']}",
                    $items
                );

                return [
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
                    'subtotal_amount' => $grossTotal,
                    'delivery_fee' => $deliveryFee,
                    'service_fee_amount' => $serviceFee,
                    'discount_amount' => $discountAmount,
                    'total_amount' => $netTotal,
                    'notes' => $order->notes,
                    'items_count' => $order->items->sum('quantity'),
                    'items_summary' => $itemsSummary,
                    'payments' => $order->payments->map(fn ($p) => [
                        'method' => $p->method,
                        'amount' => (float) $p->amount,
                    ]),
                    'table_name' => $order->table?->name ?? null,
                    'created_at' => $order->created_at->format('d/m/Y H:i'),
                    'created_at_relative' => $order->created_at->diffForHumans(),
                    'items' => $items,
                ];
            });

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
            'payments' => ['nullable', 'array'],
            'payments.*.method' => ['required_with:payments', 'string', 'in:dinheiro,pix,credito,debito'],
            'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0.01'],
            'discount_cents' => ['nullable', 'integer', 'min:0'],
            'discount_supervisor_pin' => ['nullable', 'string', 'size:4', 'regex:/^\d{4}$/'],
        ]);

        $discountCents = (int) ($validated['discount_cents'] ?? 0);
        $approvedSupervisorId = null;

        if ($discountCents > 0) {
            $approvedSupervisorId = $this->cancelOrDeleteOrderAction->resolveDiscountApprovalSupervisorId(
                $request,
                $validated['discount_supervisor_pin'] ?? null,
                false
            );

            if (empty($approvedSupervisorId)) {
                $msg = 'Desconto exige autorização de um supervisor ou administrador com PIN válido.';
                if ($request->expectsJson()) {
                    return response()->json(['success' => false, 'message' => $msg], 403);
                }

                return redirect()->back()->with('error', $msg);
            }
        } elseif ($request->hasSession()) {
            $request->session()->forget('floor_discount_approval');
        }

        try {
            $activeRegister = $this->cashRegisterLockService->requireOpenRegister();

            $actor = $request->user();
            $isWaiter = $actor && in_array(strtolower(trim((string) $actor->role)), ['waiter', 'garcom'], true);

            DB::transaction(function () use ($order, $validated, $activeRegister, $isWaiter, $discountCents, $approvedSupervisorId): void {
                /** @var Order $lockedOrder */
                $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

                if ($isWaiter && (string) $lockedOrder->type === 'delivery') {
                    throw new OrderActionException('Apenas o caixa ou administrador pode dar baixa financeira em pedidos de delivery.', 403);
                }

                if ($lockedOrder->paid_at !== null) {
                    throw new OrderActionException('Este pedido já está pago.', 422);
                }

                if (in_array($lockedOrder->status, ['cancelled', 'rejected', Order::STATUS_AWAITING_PAYMENT], true)) {
                    throw new OrderActionException('Não é possível receber pagamento manual para pedido cancelado, rejeitado ou aguardando confirmação de gateway online.', 422);
                }

                $grossTotal = (float) $lockedOrder->total_amount
                    + (float) $lockedOrder->delivery_fee
                    + round(($lockedOrder->service_fee_amount ?? 0) / 100, 2);
                $discountValue = min($grossTotal, round($discountCents / 100, 2));
                $effectiveDiscountCents = (int) round($discountValue * 100);
                $payableTotal = max(0.0, round($grossTotal - $discountValue, 2));

                $payments = $validated['payments'] ?? [];
                $totalPaid = collect($payments)->sum(fn (array $p) => (float) $p['amount']);

                if ($payableTotal > 0.01 && empty($payments)) {
                    throw new OrderActionException('Informe ao menos uma forma de pagamento.', 422);
                }

                if ($totalPaid < ($payableTotal - 0.01)) {
                    throw new OrderActionException('Valor pago insuficiente para quitar o pedido.', 422);
                }

                foreach ($payments as $paymentData) {
                    Payment::create([
                        'order_id' => $lockedOrder->id,
                        'method' => (string) $paymentData['method'],
                        'amount' => (float) $paymentData['amount'],
                        'paid_at' => now(),
                    ]);
                }

                $changeAmount = max(0.0, round($totalPaid - $payableTotal, 2));
                $previousStatus = (string) $lockedOrder->status;
                $newStatus = $lockedOrder->status === Order::STATUS_DELIVERED
                    ? Order::STATUS_COMPLETED
                    : $previousStatus;

                $updatePayload = [
                    'paid_at' => now(),
                    'cash_register_id' => $activeRegister->id,
                    'change_amount' => $changeAmount,
                    'status' => $newStatus,
                ];

                if ($effectiveDiscountCents > 0) {
                    $updatePayload['discount_amount'] = $effectiveDiscountCents;
                    $updatePayload['discount_approved_by'] = $approvedSupervisorId;
                }

                $lockedOrder->update($updatePayload);

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

            if ($discountCents > 0 && $request->hasSession()) {
                $request->session()->forget('floor_discount_approval');
            }

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

    /**
     * Enqueue a thermal bill/conference ticket for a specific order (58mm cash_register).
     */
    public function printBill(Request $request, Order $order): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'discount_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $overrideDiscount = array_key_exists('discount_cents', $validated) && $validated['discount_cents'] !== null
            ? round(((int) $validated['discount_cents']) / 100, 2)
            : null;

        try {
            $job = $this->printQueueService->enqueueOrderBill($order, $overrideDiscount);
            $code = $order->short_code ?: strtoupper(substr((string) $order->id, 0, 5));
            $message = "Conta do pedido #{$code} enviada para impressão!";

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'job_id' => $job->id,
                ]);
            }

            return redirect()->back()->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('Error printing order bill', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            $msg = 'Erro ao enviar conta do pedido para impressão.';
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $msg], 500);
            }

            return redirect()->back()->with('error', $msg);
        }
    }
}
