<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FloorElement extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'type',
        'icon',
        'position_x',
        'position_y',
        'width',
        'height',
        'visible',
    ];

    protected $casts = [
        'visible' => 'boolean',
    ];

    public static function getTypeColors(): array
    {
        return [
            'caixa' => ['bg' => '#7c3aed', 'border' => '#a78bfa'],
            'entrada' => ['bg' => '#0891b2', 'border' => '#22d3ee'],
            'cozinha' => ['bg' => '#dc2626', 'border' => '#f87171'],
            'banheiro' => ['bg' => '#4b5563', 'border' => '#9ca3af'],
            'custom' => ['bg' => '#059669', 'border' => '#34d399'],
        ];
    }
}
