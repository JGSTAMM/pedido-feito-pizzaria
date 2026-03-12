<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Neighborhood extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'delivery_fee'];

    protected $casts = [
        'delivery_fee' => 'decimal:2',
    ];
}
