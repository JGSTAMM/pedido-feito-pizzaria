<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pizza_flavors', function (Blueprint $table) {
            if (!Schema::hasColumn('pizza_flavors', 'ingredients')) {
                $table->text('ingredients')->nullable()->after('description');
            }
            if (!Schema::hasColumn('pizza_flavors', 'flavor_category')) {
                $table->string('flavor_category')->nullable()->after('ingredients');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pizza_flavors', function (Blueprint $table) {
            if (Schema::hasColumn('pizza_flavors', 'flavor_category')) {
                $table->dropColumn('flavor_category');
            }
            if (Schema::hasColumn('pizza_flavors', 'ingredients')) {
                $table->dropColumn('ingredients');
            }
        });
    }
};
