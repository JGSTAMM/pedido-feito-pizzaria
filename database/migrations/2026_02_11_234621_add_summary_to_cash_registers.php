<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->decimal('total_sales', 10, 2)->nullable()->after('calculated_balance');
            $table->integer('total_orders')->nullable()->after('total_sales');
            $table->json('payment_summary')->nullable()->after('total_orders');
        });
    }

    public function down(): void
    {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn(['total_sales', 'total_orders', 'payment_summary']);
        });
    }
};
