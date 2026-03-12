<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->string('store_name')->default('Lucchese Pizza')->after('id');
            $table->string('cnpj')->default('00.000.000/0001-00')->after('store_name');
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn(['store_name', 'cnpj']);
        });
    }
};
