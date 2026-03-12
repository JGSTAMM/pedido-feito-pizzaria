<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'type', 'target', 'ip_address', 'is_online'];

    protected $casts = [
        'is_online' => 'boolean',
    ];
}
