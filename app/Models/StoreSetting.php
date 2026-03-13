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
        'receipt_header_1',
        'receipt_header_2',
        'receipt_footer',
        'receipt_show_cnpj',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'opening_hours' => 'array',
        'receipt_show_cnpj' => 'boolean',
    ];
}
