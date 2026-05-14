<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $orderId,
        public readonly string $status,
        public readonly string $type,
        public readonly string $shortCode,
        public readonly ?string $tableId = null,
    ) {}

    /**
     * Broadcast on the public 'orders' channel (for KDS)
     * and optionally on the private 'tables.{id}' channel (for Waiter App).
     *
     * @return array<Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new Channel('orders')];

        if ($this->tableId) {
            $channels[] = new PrivateChannel("tables.{$this->tableId}");
        }

        return $channels;
    }

    /**
     * Custom broadcast event name (dot-prefix removes class name default).
     */
    public function broadcastAs(): string
    {
        return 'order.created';
    }

    /**
     * Data sent to listeners. Intentionally minimal — no PII.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'   => $this->orderId,
            'status'     => $this->status,
            'type'       => $this->type,
            'short_code' => $this->shortCode,
            'table_id'   => $this->tableId,
        ];
    }
}
