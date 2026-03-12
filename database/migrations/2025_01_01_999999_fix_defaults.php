<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pizza_flavors')) {
            Schema::table('pizza_flavors', function (Blueprint $table) {
                if (Schema::hasColumn('pizza_flavors', 'is_active')) {
                    $table->boolean('is_active')->default(true)->change();
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'type')) {
                    $table->string('type')->default('salon')->change();
                }
                if (Schema::hasColumn('orders', 'status')) {
                    $table->string('status')->default('pending')->change();
                }
            });
        }

        if (Schema::hasTable('tables')) {
            Schema::table('tables', function (Blueprint $table) {
                if (Schema::hasColumn('tables', 'status')) {
                    $table->string('status')->default('available')->change();
                }
            });
        }
    }

    public function down(): void
    {
        // Reverting defaults is tricky without knowing previous state, 
        // so we generally leave them or set to nullable if strict rollback needed.
    }
};
