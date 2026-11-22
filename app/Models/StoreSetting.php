<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class StoreSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'store_name',
        'cnpj',
        'cover_image',
        'logo_image',
        'story_media',
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
        'google_maps_place_url',
        'payment_methods',
        'custom_info',
        'mercadopago_access_token',
        'whatsapp_phone_number',
        'google_maps_api_key',
        'ifood_merchant_id',
    ];

    protected $hidden = [
        'mercadopago_access_token',
        'google_maps_api_key',
        'ifood_merchant_id',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'opening_hours' => 'array',
        'receipt_show_cnpj' => 'boolean',
        'payment_methods' => 'array',
        'story_media' => 'array',
    ];

    protected $appends = ['logo_url', 'cover_url'];

    protected function mercadopagoAccessToken(): Attribute
    {
        return $this->encryptedSecretAttribute();
    }

    protected function googleMapsApiKey(): Attribute
    {
        return $this->encryptedSecretAttribute();
    }

    protected function ifoodMerchantId(): Attribute
    {
        return $this->encryptedSecretAttribute();
    }

    private function encryptedSecretAttribute(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if ($value === null || $value === '') {
                    return $value;
                }
                try {
                    return Crypt::decryptString((string) $value);
                } catch (\Throwable) {
                    // Legacy plaintext fallback for existing production records until re-saved
                    return (string) $value;
                }
            },
            set: function ($value) {
                if ($value === null || $value === '') {
                    return $value;
                }

                return Crypt::encryptString((string) $value);
            },
        );
    }

    public function getLogoUrlAttribute()
    {
        if ($this->logo_image) {
            if (str_starts_with($this->logo_image, 'http')) {
                return $this->logo_image;
            }

            return asset('storage/'.$this->logo_image);
        }

        return null;
    }

    public function getCoverUrlAttribute()
    {
        if ($this->cover_image) {
            if (str_starts_with($this->cover_image, 'http')) {
                return $this->cover_image;
            }

            return asset('storage/'.$this->cover_image);
        }

        return null;
    }

    public function getStoryMediaAttribute($value)
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        
        if (!is_array($value)) return [];

        return array_map(function ($media) {
            if (isset($media['url']) && !str_starts_with($media['url'], 'http')) {
                $media['url'] = asset('storage/' . $media['url']);
            }
            return $media;
        }, $value);
    }


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
