<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'price', 'category', 'is_active', 'show_on_digital_menu', 'image'];

    protected $casts = [
        'is_active' => 'boolean',
        'show_on_digital_menu' => 'boolean',
    ];

    protected $appends = ['image_url'];

    protected function price(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function imageUrl(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::get(fn () =>
            $this->image ? asset('storage/' . $this->image) : null
        );
    }
}
