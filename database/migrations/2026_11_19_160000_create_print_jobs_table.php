<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id')->nullable()->index();
            $table->uuid('table_id')->nullable()->index();
            $table->string('type')->default('kitchen')->index(); // kitchen, bill, test
            $table->string('target')->default('kitchen')->index(); // kitchen, cash_register
            $table->string('status')->default('pending')->index(); // pending, processing, printed, failed
            $table->json('payload');
            $table->string('printer_name')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('claimed_at')->nullable()->index();
            $table->timestamp('printed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_jobs');
    }
};
