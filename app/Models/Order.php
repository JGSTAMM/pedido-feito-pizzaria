<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'table_id',
        'user_id',
        'type',
        'customer_name',
        'customer_phone',
        'payer_email',
        'delivery_address',
        'delivery_complement',
        'neighborhood_id',
        'custom_neighborhood',
        'delivery_fee',
        'change_amount',
        'cash_register_id',
        'short_code',
        'online_payment_status',
        'payment_gateway_id',
        'pix_qr_code',
        'rejection_reason',
    ];

    // Order statuses
    const STATUS_AWAITING_PAYMENT = 'awaiting_payment';
    const STATUS_PAID_ONLINE = 'paid_online';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PENDING = 'pending';
    const STATUS_PREPARING = 'preparing';
    const STATUS_READY = 'ready';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_PAID = 'paid';
    const STATUS_COMPLETED = 'completed';

    // Online payment statuses
    const ONLINE_PAYMENT_PENDING = 'pending';
    const ONLINE_PAYMENT_APPROVED = 'approved';
    const ONLINE_PAYMENT_REJECTED = 'rejected';
    const ONLINE_PAYMENT_REFUNDED = 'refunded';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if ($order->type === 'delivery' && !$order->status) {
                $order->status = self::STATUS_PENDING;
            }

            // Generate unique short code with guard against infinite loop
            if (empty($order->short_code)) {
                $maxAttempts = 10;
                $attempts = 0;
                do {
                    $code = strtoupper(\Illuminate\Support\Str::random(5));
                    $attempts++;
                    if ($attempts >= $maxAttempts) {
                        throw new \RuntimeException('Unable to generate a unique short_code after ' . $maxAttempts . ' attempts.');
                    }
                } while (self::where('short_code', $code)->exists());

                $order->short_code = $code;
            }
        });
    }

    protected $casts = [
        'total_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'ready_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    // ==================== Relationships ====================

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    // Removed: customer() - no Customer model in this project; use user() instead

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function neighborhood()
    {
        return $this->belongsTo(Neighborhood::class);
    }

    // ==================== Scopes ====================

    public function scopeOnlinePending($query)
    {
        return $query->where('status', self::STATUS_PAID_ONLINE);
    }

    public function scopeAwaitingPayment($query)
    {
        return $query->where('status', self::STATUS_AWAITING_PAYMENT);
    }

    public function scopeActiveKitchen($query)
    {
        return $query->whereIn('status', [
            self::STATUS_PENDING,
            self::STATUS_PREPARING,
            self::STATUS_READY,
            self::STATUS_ACCEPTED,
        ]);
    }

    // ==================== Helpers ====================

    public function isOnlineOrder(): bool
    {
        return !empty($this->payment_gateway_id);
    }

    public function isPaidOnline(): bool
    {
        return $this->online_payment_status === self::ONLINE_PAYMENT_APPROVED;
    }

    public function canBeAccepted(): bool
    {
        return $this->status === self::STATUS_PAID_ONLINE;
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, [
            self::STATUS_PAID_ONLINE,
            self::STATUS_AWAITING_PAYMENT,
        ]);
    }
}
