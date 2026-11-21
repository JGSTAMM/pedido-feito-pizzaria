<?php

namespace App\Application\Orders;

use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PrintJob;
use App\Models\Table;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class CancelOrDeleteOrderAction
{
    /**
     * Validate a 4-digit supervisor/admin PIN without any session caching or admin bypass.
     *
     * @return array{valid: bool, reason: string|null, supervisor: User|null}
     */
    public function verifySupervisorPin(string $pin): array
    {
        if (! preg_match('/^\d{4}$/', $pin)) {
            return [
                'valid' => false,
                'reason' => 'invalid_pin',
                'supervisor' => null,
            ];
        }

        $supervisors = User::query()
            ->whereRaw('LOWER(TRIM(role)) IN (?, ?)', ['admin', 'supervisor'])
            ->whereNotNull('pin_hash')
            ->get();

        if ($supervisors->isEmpty()) {
            return [
                'valid' => false,
                'reason' => 'not_configured',
                'supervisor' => null,
            ];
        }

        foreach ($supervisors as $supervisor) {
            if (Hash::check($pin, $supervisor->pin_hash)) {
                return [
                    'valid' => true,
                    'reason' => null,
                    'supervisor' => $supervisor,
                ];
            }
        }

        return [
            'valid' => false,
            'reason' => 'invalid_pin',
            'supervisor' => null,
        ];
    }

    /**
     * Delete/cancel a full order safely after verifying a supervisor/admin PIN.
     *
     * @throws OrderActionException
     */
    public function deleteOrder(Order $order, string $pin, User $actor, ?string $reason = null): User
    {
        $supervisor = $this->requireSupervisorPin($pin);

        DB::transaction(function () use ($order, $supervisor, $actor, $reason): void {
            /** @var Order|null $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (! $lockedOrder) {
                throw new OrderActionException('Pedido não encontrado ou já excluído.', 404, [], null, 'not_found');
            }

            $previousStatus = (string) $lockedOrder->status;
            $tableId = $lockedOrder->table_id;

            $this->cancelLockedOrder($lockedOrder, $supervisor, $actor, $reason);

            if ($tableId) {
                $table = Table::find($tableId);
                if ($table && $table->activeOrders()->doesntExist()) {
                    $table->update(['status' => 'available']);
                }
            }

            Cache::forget('dashboard_stats');

            $orderId = $lockedOrder->id;
            $orderType = (string) $lockedOrder->type;

            DB::afterCommit(function () use ($orderId, $previousStatus, $orderType, $tableId): void {
                $this->broadcastOrderCancelled($orderId, $previousStatus, $orderType, $tableId);
            });
        });

        return $supervisor;
    }

    /**
     * Delete a single item from an order after verifying a supervisor/admin PIN.
     * If it is the last active item on the order, the entire order is safely deleted and the table freed if empty.
     *
     * @return array{order_deleted: bool, new_total: float, supervisor: User}
     *
     * @throws OrderActionException
     */
    public function deleteOrderItem(Order $order, OrderItem $item, string $pin, User $actor, ?string $reason = null): array
    {
        $supervisor = $this->requireSupervisorPin($pin);

        if ((string) $item->order_id !== (string) $order->id) {
            throw new OrderActionException('Item não pertence a este pedido.', 422, [], null, 'invalid_item');
        }

        return DB::transaction(function () use ($order, $item, $supervisor, $actor, $reason): array {
            /** @var Order|null $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (! $lockedOrder) {
                throw new OrderActionException('Pedido não encontrado ou já excluído.', 404, [], null, 'not_found');
            }

            /** @var OrderItem|null $lockedItem */
            $lockedItem = OrderItem::where('id', $item->id)
                ->where('order_id', $lockedOrder->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedItem) {
                throw new OrderActionException('Item não encontrado ou já excluído.', 404, [], null, 'not_found');
            }

            $remainingItemsCount = OrderItem::where('order_id', $lockedOrder->id)
                ->where('id', '!=', $lockedItem->id)
                ->count();

            $previousStatus = (string) $lockedOrder->status;
            $tableId = $lockedOrder->table_id;

            if ($remainingItemsCount === 0) {
                $this->cancelLockedOrder($lockedOrder, $supervisor, $actor, $reason ?: 'Último item removido');

                if ($tableId) {
                    $table = Table::find($tableId);
                    if ($table && $table->activeOrders()->doesntExist()) {
                        $table->update(['status' => 'available']);
                    }
                }

                Cache::forget('dashboard_stats');

                $orderId = $lockedOrder->id;
                $orderType = (string) $lockedOrder->type;

                DB::afterCommit(function () use ($orderId, $previousStatus, $orderType, $tableId): void {
                    $this->broadcastOrderCancelled($orderId, $previousStatus, $orderType, $tableId);
                });

                return [
                    'order_deleted' => true,
                    'new_total' => 0.0,
                    'supervisor' => $supervisor,
                ];
            }

            $cleanReason = trim((string) $reason);
            $itemSubtotal = (float) $lockedItem->subtotal;
            $itemDescription = $lockedItem->description ?? $lockedItem->product?->name ?? 'Item';

            $lockedItem->delete();

            // OrderItem.subtotal is persisted as integer cents in DB; Order.total_amount mutator expects Reais.
            $newTotalCents = (int) OrderItem::where('order_id', $lockedOrder->id)->sum('subtotal');
            $newTotalReais = round($newTotalCents / 100, 2);

            $lockedOrder->update([
                'total_amount' => $newTotalReais,
            ]);

            Cache::forget('dashboard_stats');

            Log::warning('Order item deleted with supervisor PIN', [
                'order_id' => $lockedOrder->id,
                'short_code' => $lockedOrder->short_code,
                'item_id' => $lockedItem->id,
                'item_description' => $itemDescription,
                'item_subtotal' => $itemSubtotal,
                'new_order_total' => $newTotalReais,
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'supervisor_id' => $supervisor->id,
                'supervisor_name' => $supervisor->name,
                'reason' => $cleanReason,
            ]);

            $orderId = $lockedOrder->id;
            $orderStatus = (string) $lockedOrder->status;
            $orderType = (string) $lockedOrder->type;

            DB::afterCommit(function () use ($orderId, $orderStatus, $orderType, $tableId): void {
                try {
                    event(new OrderStatusUpdated(
                        orderId: $orderId,
                        status: $orderStatus,
                        previousStatus: $orderStatus,
                        type: $orderType,
                        tableId: $tableId,
                    ));
                } catch (\Throwable $e) {
                    Log::warning('Broadcast failed after order item deletion: '.$e->getMessage());
                }
            });

            return [
                'order_deleted' => false,
                'new_total' => $newTotalReais,
                'supervisor' => $supervisor,
            ];
        });
    }

    /**
     * Cancel/delete all active orders for a table (full comanda wipe) after verifying a supervisor/admin PIN.
     *
     * @return array{deleted_count: int, supervisor: User}
     *
     * @throws OrderActionException
     */
    public function clearTableComanda(Table $table, string $pin, User $actor, ?string $reason = null): array
    {
        $supervisor = $this->requireSupervisorPin($pin);

        $deletedCount = DB::transaction(function () use ($table, $supervisor, $actor, $reason): int {
            $orders = $table->activeOrders()->lockForUpdate()->get();

            if ($orders->isEmpty()) {
                throw new OrderActionException('Esta mesa não possui pedidos ativos na comanda.', 404, [], null, 'no_active_orders');
            }

            $eventsPayload = [];

            foreach ($orders as $order) {
                $eventsPayload[] = [
                    'orderId' => $order->id,
                    'previousStatus' => (string) $order->status,
                    'type' => (string) $order->type,
                    'tableId' => $table->id,
                ];

                $this->cancelLockedOrder($order, $supervisor, $actor, $reason ?: 'Comanda da mesa apagada');
            }

            $table->update(['status' => 'available']);
            Cache::forget('dashboard_stats');

            DB::afterCommit(function () use ($eventsPayload): void {
                foreach ($eventsPayload as $payload) {
                    $this->broadcastOrderCancelled(
                        $payload['orderId'],
                        $payload['previousStatus'],
                        $payload['type'],
                        $payload['tableId']
                    );
                }
            });

            return $orders->count();
        });

        return [
            'deleted_count' => $deletedCount,
            'supervisor' => $supervisor,
        ];
    }

    /**
     * @throws OrderActionException
     */
    private function requireSupervisorPin(string $pin): User
    {
        $check = $this->verifySupervisorPin($pin);

        if (! $check['valid'] || ! $check['supervisor'] instanceof User) {
            if ($check['reason'] === 'not_configured') {
                throw new OrderActionException(
                    'Nenhum PIN de supervisor configurado. Defina em Configurações > Segurança.',
                    401,
                    [],
                    null,
                    'not_configured'
                );
            }

            throw new OrderActionException(
                'Código PIN inválido. Informe o PIN de 4 dígitos de um supervisor ou administrador.',
                401,
                [],
                null,
                'invalid_pin'
            );
        }

        return $check['supervisor'];
    }

    private function cancelLockedOrder(Order $order, User $supervisor, User $actor, ?string $reason): void
    {
        // Cancel queued thermal kitchen jobs that have not yet been claimed/printed
        PrintJob::where('order_id', $order->id)
            ->where('status', 'pending')
            ->delete();

        $order->payments()->delete();
        $order->items()->delete();

        $cleanReason = trim((string) $reason);
        $auditNote = sprintf(
            '[Excluído por %s | PIN: %s]%s',
            $actor->name,
            $supervisor->name,
            $cleanReason !== '' ? " {$cleanReason}" : ''
        );

        $orderTotal = (float) $order->total_amount;

        $order->update([
            'status' => 'cancelled',
            'paid_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $auditNote,
        ]);

        $order->delete();

        Log::warning('Order deleted with supervisor PIN', [
            'order_id' => $order->id,
            'short_code' => $order->short_code,
            'total_amount' => $orderTotal,
            'table_id' => $order->table_id,
            'actor_id' => $actor->id,
            'actor_name' => $actor->name,
            'supervisor_id' => $supervisor->id,
            'supervisor_name' => $supervisor->name,
            'reason' => $cleanReason,
        ]);
    }

    private function broadcastOrderCancelled(string $orderId, string $previousStatus, string $type, ?string $tableId): void
    {
        try {
            event(new OrderStatusUpdated(
                orderId: $orderId,
                status: 'cancelled',
                previousStatus: $previousStatus,
                type: $type,
                tableId: $tableId,
            ));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed after order cancellation: '.$e->getMessage());
        }
    }
}
