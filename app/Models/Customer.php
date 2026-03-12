<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function neighborhood()
    {
        return $this->belongsTo(Neighborhood::class);
    }
}
