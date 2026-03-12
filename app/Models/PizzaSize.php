<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PizzaSize extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'slices',
        'max_flavors',
        'is_special_broto_rule',
    ];

    protected $casts = [
        'is_special_broto_rule' => 'boolean',
    ];
}
