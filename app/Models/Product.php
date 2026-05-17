<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'description', 'price', 'category', 'is_active', 'is_active_delivery', 'is_active_pos', 'variations', 'show_on_digital_menu', 'image'];

    protected $casts = [
        'is_active'            => 'boolean',
        'is_active_delivery'   => 'boolean',
        'is_active_pos'        => 'boolean',
        'variations'           => 'array',
        'show_on_digital_menu' => 'boolean',
    ];

    protected $appends = ['image_url'];

    protected function variations(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => collect(is_string($value) ? json_decode($value, true) : $value)->map(function($v) {
                return [
                    'name' => $v['name'] ?? '',
                    'price' => isset($v['price']) ? $v['price'] / 100 : 0,
                ];
            })->toArray(),
            set: fn ($value) => json_encode(collect($value)->map(function($v) {
                return [
                    'name' => $v['name'] ?? '',
                    'price' => isset($v['price']) ? (int) round($v['price'] * 100) : 0,
                ];
            })->toArray()),
        );
    }

    protected function price(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->image ? asset('storage/'.$this->image) : null
        );
    }
}
