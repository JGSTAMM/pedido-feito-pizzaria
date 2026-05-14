<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $orderId,
        public readonly string $status,
        public readonly string $previousStatus,
        public readonly string $type,
        public readonly ?string $tableId = null,
    ) {}

    /**
     * Broadcast to:
     * - public 'orders' channel  → KDS + Floor overview
     * - public 'order.{id}' channel → Customer order tracking (UUID, not guessable)
     * - private 'tables.{id}' channel → Waiter App (when table order)
     *
     * @return array<Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('orders'),
            new Channel("order.{$this->orderId}"),
        ];

        if ($this->tableId) {
            $channels[] = new PrivateChannel("tables.{$this->tableId}");
        }

        return $channels;
    }

    /**
     * Custom broadcast event name.
     */
    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    /**
     * Data sent to listeners. Intentionally minimal — no PII.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'        => $this->orderId,
            'status'          => $this->status,
            'previous_status' => $this->previousStatus,
            'type'            => $this->type,
            'table_id'        => $this->tableId,
        ];
    }
}
