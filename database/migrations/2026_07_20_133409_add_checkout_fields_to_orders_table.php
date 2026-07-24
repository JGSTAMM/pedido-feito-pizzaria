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
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('service_fee_amount')->nullable()->comment('Service fee in cents');
            $table->integer('discount_amount')->nullable()->comment('Discount in cents');
            $table->foreignUuid('discount_approved_by')->nullable()->comment('Supervisor who approved discount')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['discount_approved_by']);
            $table->dropColumn(['service_fee_amount', 'discount_amount', 'discount_approved_by']);
        });
    }
};
