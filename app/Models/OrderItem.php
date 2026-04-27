<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory, HasUuids, SoftDeletes;


    protected $fillable = [
        'order_id',
        'pizza_size_id',
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'type',
        'notes',
        'description',
    ];
    protected $casts = [];

    protected function unitPrice(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function subtotal(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }



    public function pizzaSize()
    {
        return $this->belongsTo(PizzaSize::class);
    }

    public function flavors()
    {
        return $this->belongsToMany(PizzaFlavor::class, 'order_item_flavors')
                    ->withPivot('fraction')
                    ->withTimestamps();
    }
}
