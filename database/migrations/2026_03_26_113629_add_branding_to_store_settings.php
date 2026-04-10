<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('cnpj');
            $table->string('logo_image')->nullable()->after('cover_image');
            $table->text('description')->nullable()->after('logo_image');
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn(['cover_image', 'logo_image', 'description']);
        });
    }
};
