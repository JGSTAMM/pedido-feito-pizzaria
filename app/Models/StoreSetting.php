<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'store_name',
        'cnpj',
        'cover_image',
        'logo_image',
        'description',
        'is_open',
        'opening_hours',
        'receipt_header_1',
        'receipt_header_2',
        'receipt_footer',
        'receipt_show_cnpj',
        'phone',
        'full_address',
        'google_maps_embed_url',
        'payment_methods',
        'custom_info',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'opening_hours' => 'array',
        'receipt_show_cnpj' => 'boolean',
        'payment_methods' => 'array',
    ];

    protected $appends = ['logo_url', 'cover_url'];

    public function getLogoUrlAttribute()
    {
        if ($this->logo_image) {
            if (str_starts_with($this->logo_image, 'http')) {
                return $this->logo_image;
            }
            return asset('storage/' . $this->logo_image);
        }
        return null;
    }

    public function getCoverUrlAttribute()
    {
        if ($this->cover_image) {
            if (str_starts_with($this->cover_image, 'http')) {
                return $this->cover_image;
            }
            return asset('storage/' . $this->cover_image);
        }
        return null;
    }

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
