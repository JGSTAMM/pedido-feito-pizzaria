<?php

namespace App\Application\Orders;

use App\Events\OrderStatusUpdated;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class UpdateKdsOrderStatusAction
{
    private const ALLOWED_STATUSES = ['preparing', 'ready', 'delivered'];

    private const ALLOWED_TRANSITIONS = [
        'pending' => ['preparing', 'ready'],
        'accepted' => ['preparing', 'ready'],
        'preparing' => ['ready', 'delivered'],
        'ready' => ['delivered', 'preparing'],
    ];

    public function execute(Order $order, string $status): void
    {
        if (! in_array($status, self::ALLOWED_STATUSES, true)) {
            return;
        }

        $currentStatus = (string) $order->status;
        if (in_array($currentStatus, [Order::STATUS_AWAITING_PAYMENT, Order::STATUS_REJECTED, 'cancelled', Order::STATUS_COMPLETED], true)) {
            return;
        }

        $allowedNext = self::ALLOWED_TRANSITIONS[$currentStatus] ?? [];
        if (! in_array($status, $allowedNext, true)) {
            return;
        }

        $previousStatus = $currentStatus;

        $updatePayload = ['status' => $status];
        if ($status === 'ready' && $order->ready_at === null) {
            $updatePayload['ready_at'] = now();
        }

        $order->update($updatePayload);

        // Broadcast the status change so all connected UIs update instantly:
        // KDS columns, Floor table cards, and customer order tracking page.
        try {
            event(new OrderStatusUpdated(
                orderId: $order->id,
                status: $status,
                previousStatus: $previousStatus,
                type: $order->type,
                tableId: $order->table_id,
            ));
        } catch (\Throwable $broadcastEx) {
            Log::warning('Broadcast failed on KDS status update: '.$broadcastEx->getMessage());
        }
    }
}
