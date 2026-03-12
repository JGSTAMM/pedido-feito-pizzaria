<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone', 20)->unique()->nullable();
            $table->string('document', 20)->nullable(); // CPF
            $table->foreignUuid('neighborhood_id')->nullable()->constrained()->nullOnDelete();
            $table->string('address')->nullable();
            $table->string('number', 20)->nullable();
            $table->string('complement')->nullable();
            $table->timestamps();
        });

        // Add customer_id to orders
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignUuid('customer_id')->nullable()->after('table_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
        });

        Schema::dropIfExists('customers');
    }
};
