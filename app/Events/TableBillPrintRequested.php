<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class TableBillPrintRequested implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $tableId,
        public readonly string $tableName,
        public readonly array $order,
    ) {}

    /**
     * Broadcast on the public 'orders' channel (for KDS and POS printers).
     *
     * @return array<Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('orders')];
    }

    /**
     * Custom broadcast event name.
     */
    public function broadcastAs(): string
    {
        return 'table.bill.printed';
    }

    /**
     * Data sent to listeners.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'table_id'   => $this->tableId,
            'table_name' => $this->tableName,
            'order'      => $this->order,
        ];
    }
}
