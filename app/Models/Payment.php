<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'order_id', 'method', 'amount', 'notes',
        'gateway_id', 'gateway_status', 'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    protected function amount(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public static function getMethodOptions(): array
    {
        return [
            'dinheiro' => '💵 Dinheiro',
            'pix' => '📱 PIX',
            'pix_online' => '📱 PIX Online',
            'credito' => '💳 Crédito',
            'credito_online' => '💳 Crédito Online',
            'debito' => '💳 Débito',
        ];
    }

    public function isOnline(): bool
    {
        return !empty($this->gateway_id);
    }
}
