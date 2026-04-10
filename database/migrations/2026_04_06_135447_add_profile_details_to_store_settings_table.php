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
            $table->string('phone')->nullable();
            $table->string('full_address')->nullable();
            $table->text('google_maps_embed_url')->nullable();
            $table->json('payment_methods')->nullable();
            $table->longText('custom_info')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'full_address',
                'google_maps_embed_url',
                'payment_methods',
                'custom_info'
            ]);
        });
    }
};
