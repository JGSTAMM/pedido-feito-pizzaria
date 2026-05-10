<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 1 ERP Upgrade.
     *
     * products: replaces is_active with dual-channel toggles + adds variations JSON.
     * pizza_flavors: adds ingredients_json (old string column kept until Phase 2 cutover).
     */
    public function up(): void
    {
        // --- products table ---
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_active');

            $table->boolean('is_active_delivery')->default(true)->after('price');
            $table->boolean('is_active_pos')->default(true)->after('is_active_delivery');
            $table->json('variations')->nullable()->after('is_active_pos');
        });

        // --- pizza_flavors table ---
        Schema::table('pizza_flavors', function (Blueprint $table) {
            // Keep old `ingredients` string intact — Phase 2 will drop it after data migration.
            $table->json('ingredients_json')->nullable()->after('ingredients');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_active_delivery', 'is_active_pos', 'variations']);
            $table->boolean('is_active')->default(true)->after('price');
        });

        Schema::table('pizza_flavors', function (Blueprint $table) {
            $table->dropColumn('ingredients_json');
        });
    }
};
