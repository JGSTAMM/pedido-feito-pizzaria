<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('paid_at')->nullable()->after('notes');
            $table->decimal('change_amount', 10, 2)->default(0)->after('paid_at');
            $table->timestamp('ready_at')->nullable()->after('change_amount');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['paid_at', 'change_amount', 'ready_at']);
        });
    }
};
