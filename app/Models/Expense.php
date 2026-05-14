<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Expense extends Model
{
    use HasUuids;

    protected $fillable = [
        'description',
        'amount',
        'category',
        'expense_date',
        'is_paid',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'is_paid' => 'boolean',
    ];

    /**
     * Interact with the expense's amount.
     */
    protected function amount(): Attribute
    {
        return Attribute::make(
            get: fn (int $value) => $value / 100,
            set: fn (float $value) => (int) round($value * 100),
        );
    }
}
