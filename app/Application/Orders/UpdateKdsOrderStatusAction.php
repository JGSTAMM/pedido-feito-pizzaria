<?php

namespace App\Application\Orders;

use App\Models\Order;

class UpdateKdsOrderStatusAction
{
    private const ALLOWED_STATUSES = ['preparing', 'ready', 'delivered'];

    public function execute(Order $order, string $status): void
    {
        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return;
        }

        $order->update(['status' => $status]);
    }
}
