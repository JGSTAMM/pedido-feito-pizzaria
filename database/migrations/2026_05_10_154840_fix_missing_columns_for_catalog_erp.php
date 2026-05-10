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
        // Fix missing columns in pizza_flavors
        Schema::table('pizza_flavors', function (Blueprint $table) {
            if (!Schema::hasColumn('pizza_flavors', 'is_active_delivery')) {
                $table->boolean('is_active_delivery')->default(true)->after('is_active');
            }
            if (!Schema::hasColumn('pizza_flavors', 'is_active_pos')) {
                $table->boolean('is_active_pos')->default(true)->after('is_active_delivery');
            }
        });

        // Fix missing description in products
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pizza_flavors', function (Blueprint $table) {
            $table->dropColumn(['is_active_delivery', 'is_active_pos']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
