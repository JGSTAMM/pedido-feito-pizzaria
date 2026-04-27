<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    protected $casts = [
        'subtotal' => 'decimal:2',
    ];

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
