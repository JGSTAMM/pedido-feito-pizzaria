<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'status', 'position_x', 'position_y', 'width', 'height'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get active (open) orders for this table
     */
    public function activeOrders()
    {
        return $this->orders()->whereNotIn('status', ['completed', 'paid', 'cancelled']);
    }
}
