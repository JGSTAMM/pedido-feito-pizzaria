<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJob extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'table_id',
        'type',
        'target',
        'status',
        'payload',
        'printer_name',
        'attempts',
        'claimed_at',
        'printed_at',
        'error_message',
    ];

    protected $casts = [
        'payload' => 'array',
        'claimed_at' => 'datetime',
        'printed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeReadyToClaim(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('status', 'pending')
                ->orWhere(function (Builder $sub) {
                    $sub->where('status', 'processing')
                        ->where('claimed_at', '<', now()->subSeconds(45));
                });
        });
    }
}
