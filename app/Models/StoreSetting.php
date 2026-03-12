<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'store_name',
        'cnpj',
        'is_open',
        'opening_hours',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'opening_hours' => 'array',
    ];
}
