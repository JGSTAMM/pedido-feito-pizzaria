<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->string('mercadopago_access_token')->nullable();
            $table->string('whatsapp_phone_number')->nullable();
            $table->string('google_maps_api_key')->nullable();
            $table->string('ifood_merchant_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn([
                'mercadopago_access_token',
                'whatsapp_phone_number',
                'google_maps_api_key',
                'ifood_merchant_id',
            ]);
        });
    }
};
