<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PrinterSetting extends Model
{
    use HasUuids;

    protected $fillable = ['key', 'value'];

    protected static function booted()
    {
        static::saved(function ($setting) {
            \Illuminate\Support\Facades\Cache::forget('printer_settings');
        });

        static::deleted(function ($setting) {
            \Illuminate\Support\Facades\Cache::forget('printer_settings');
        });
    }
}
