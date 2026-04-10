<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('metric_date');
            $table->string('tenant_key', 100);
            $table->string('tenant_name');
            $table->string('printer_type', 20);
            $table->unsignedInteger('total_attempts')->default(0);
            $table->unsignedInteger('success_count')->default(0);
            $table->unsignedInteger('failure_count')->default(0);
            $table->unsignedInteger('network_failure_count')->default(0);
            $table->unsignedInteger('hardware_failure_count')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->unique(['metric_date', 'tenant_key', 'printer_type'], 'print_metrics_unique_daily_tenant_printer');
            $table->index(['tenant_key', 'metric_date'], 'print_metrics_tenant_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_metrics');
    }
};
