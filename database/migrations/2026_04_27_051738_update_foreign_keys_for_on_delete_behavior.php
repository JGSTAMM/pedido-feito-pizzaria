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
        Schema::table('order_items', function (Blueprint $table) {
            // Drop existing foreign keys
            $table->dropForeign(['pizza_size_id']);
            $table->dropForeign(['product_id']);

            // Recreate with nullOnDelete behavior
            $table->foreign('pizza_size_id')
                ->references('id')
                ->on('pizza_sizes')
                ->nullOnDelete();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->nullOnDelete();
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            // Drop existing foreign key
            $table->dropForeign(['user_id']);

            // Recreate with restrictOnDelete behavior
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['pizza_size_id']);
            $table->dropForeign(['product_id']);

            $table->foreign('pizza_size_id')
                ->references('id')
                ->on('pizza_sizes');

            $table->foreign('product_id')
                ->references('id')
                ->on('products');
        });

        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropForeign(['user_id']);

            $table->foreign('user_id')
                ->references('id')
                ->on('users');
        });
    }
};
