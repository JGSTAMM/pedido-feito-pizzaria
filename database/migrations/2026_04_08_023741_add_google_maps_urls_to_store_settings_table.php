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
            if (!Schema::hasColumn('store_settings', 'google_maps_embed_url')) {
                $table->text('google_maps_embed_url')->nullable()->after('full_address');
            }
            if (!Schema::hasColumn('store_settings', 'google_maps_place_url')) {
                $table->text('google_maps_place_url')->nullable()->after('google_maps_embed_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn(['google_maps_embed_url', 'google_maps_place_url']);
        });
    }
};
