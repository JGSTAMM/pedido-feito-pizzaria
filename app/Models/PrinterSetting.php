<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PrinterSetting extends Model
{
    use HasUuids;

    protected $fillable = ['key', 'value'];

    protected static function booted()
    {
        static::saved(function ($setting) {
            Cache::forget('printer_settings');
        });

        static::deleted(function ($setting) {
            Cache::forget('printer_settings');
        });
    }
}
