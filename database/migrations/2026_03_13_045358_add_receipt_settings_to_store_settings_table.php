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
            $table->string('receipt_header_1')->nullable();
            $table->string('receipt_header_2')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->boolean('receipt_show_cnpj')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn([
                'receipt_header_1',
                'receipt_header_2',
                'receipt_footer',
                'receipt_show_cnpj',
            ]);
        });
    }
};
