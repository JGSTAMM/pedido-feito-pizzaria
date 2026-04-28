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
        // Usa ALTER TABLE direto no MySQL para evitar problemas de compatibilidade
        if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) DEFAULT 'dinheiro'");
        } else {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('method', 50)->default('dinheiro')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() !== 'sqlite') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('dinheiro', 'pix', 'credito', 'debito') DEFAULT 'dinheiro'");
        } else {
            Schema::table('payments', function (Blueprint $table) {
                $table->enum('method', ['dinheiro', 'pix', 'credito', 'debito'])->default('dinheiro')->change();
            });
        }
    }
};
