<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('image')->nullable()->after('show_on_digital_menu');
        });

        Schema::table('pizza_flavors', function (Blueprint $table) {
            $table->string('image')->nullable()->after('show_on_digital_menu');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('image');
        });

        Schema::table('pizza_flavors', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    }
};
