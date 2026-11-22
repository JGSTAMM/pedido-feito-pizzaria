<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->text('mercadopago_access_token')->nullable()->change();
            $table->text('google_maps_api_key')->nullable()->change();
            $table->text('ifood_merchant_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->string('mercadopago_access_token')->nullable()->change();
            $table->string('google_maps_api_key')->nullable()->change();
            $table->string('ifood_merchant_id')->nullable()->change();
        });
    }
};
