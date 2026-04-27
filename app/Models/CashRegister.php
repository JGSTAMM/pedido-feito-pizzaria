<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'status',
        'opened_at',
        'closed_at',
        'opening_balance',
        'closing_balance',
        'calculated_balance',
        'difference',
        'total_sales',
        'payment_summary',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'payment_summary' => 'array',
    ];

    protected function openingBalance(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function closingBalance(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function calculatedBalance(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function difference(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function totalSales(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
