<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_key', 100);
            $table->string('tenant_name');
            $table->foreignUuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('printer_type', 20);
            $table->string('error_code', 60);
            $table->text('message');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_key', 'resolved_at'], 'printer_alerts_tenant_resolved_idx');
            $table->index(['printer_type', 'created_at'], 'printer_alerts_printer_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_alerts');
    }
};
