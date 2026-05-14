<?php

namespace App\Application\Orders;

use App\Events\OrderStatusUpdated;
use App\Models\Order;

class UpdateKdsOrderStatusAction
{
    private const ALLOWED_STATUSES = ['preparing', 'ready', 'delivered'];

    public function execute(Order $order, string $status): void
    {
        if (! in_array($status, self::ALLOWED_STATUSES, true)) {
            return;
        }

        $previousStatus = $order->status;

        $order->update(['status' => $status]);

        // Broadcast the status change so all connected UIs update instantly:
        // KDS columns, Floor table cards, and customer order tracking page.
        event(new OrderStatusUpdated(
            orderId: $order->id,
            status: $status,
            previousStatus: $previousStatus,
            type: $order->type,
            tableId: $order->table_id,
        ));
    }
}
