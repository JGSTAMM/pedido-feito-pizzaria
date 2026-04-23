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
        // Usa ALTER TABLE direto para evitar problemas de compatibilidade com Doctrine/DBAL ao mudar ENUM
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) DEFAULT 'dinheiro'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverte para o ENUM restrito original (atenção: pode falhar se houver dados 'credito_online' salvos)
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('dinheiro', 'pix', 'credito', 'debito') DEFAULT 'dinheiro'");
    }
};
