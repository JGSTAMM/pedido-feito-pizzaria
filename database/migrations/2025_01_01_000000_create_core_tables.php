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
        // 1. pizza_sizes
        Schema::create('pizza_sizes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->integer('slices');
            $table->integer('max_flavors');
            $table->boolean('is_special_broto_rule')->default(false);
            $table->timestamps();
        });

        // 2. pizza_flavors
        Schema::create('pizza_flavors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('ingredients')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->timestamps();
        });

        // 3. products
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->string('category');
            $table->timestamps();
        });

        // 4. tables
        Schema::create('tables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('status')->default('available'); // available, occupied, payment_pending
            $table->timestamps();
        });

        // 5. neighborhoods
        Schema::create('neighborhoods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->timestamps();
        });

        // 6. orders
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('table_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending'); // pending, approved, preparing, ready, delivered, cancelled
            $table->string('type'); // delivery, salon
            $table->string('customer_name')->nullable();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 7. order_items
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('pizza_size_id')->nullable()->constrained();
            $table->foreignUuid('product_id')->nullable()->constrained();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });

        // 8. order_item_flavors
        Schema::create('order_item_flavors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('pizza_flavor_id')->constrained()->cascadeOnDelete();
            $table->string('fraction'); // e.g., "1/2", "1/3"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_flavors');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('neighborhoods');
        Schema::dropIfExists('tables');
        Schema::dropIfExists('products');
        Schema::dropIfExists('pizza_flavors');
        Schema::dropIfExists('pizza_sizes');
    }
};
