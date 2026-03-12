<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignUuid('neighborhood_id')->nullable()->after('table_id')->constrained()->nullOnDelete();
            $table->string('delivery_address')->nullable()->after('customer_name');
            $table->string('delivery_complement')->nullable()->after('delivery_address');
            $table->decimal('delivery_fee', 10, 2)->default(0)->after('delivery_complement');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['neighborhood_id']);
            $table->dropColumn(['neighborhood_id', 'delivery_address', 'delivery_complement', 'delivery_fee']);
        });
    }
};
