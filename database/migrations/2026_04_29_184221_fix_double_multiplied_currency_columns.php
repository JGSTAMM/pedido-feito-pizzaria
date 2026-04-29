<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'pizza_flavors' => ['base_price'],
            'products' => ['price'],
            'neighborhoods' => ['delivery_fee'],
            'orders' => ['total_amount', 'delivery_fee', 'change_amount'],
            'order_items' => ['unit_price', 'subtotal'],
            'payments' => ['amount'],
            'cash_registers' => [
                'opening_balance', 
                'closing_balance', 
                'calculated_balance', 
                'difference', 
                'total_sales'
            ],
        ];

        foreach ($tables as $table => $columns) {
            if (!Schema::hasTable($table)) continue;

            foreach ($columns as $column) {
                if (Schema::hasColumn($table, $column)) {
                    // Divide por 10.000 apenas se o valor for suspeito (> 1.000.000 centavos = R$ 10.000,00)
                    // Isso evita reduzir valores que já estejam corretos (ex: novos itens criados após o bug)
                    DB::table($table)
                        ->where($column, '>', 1000000)
                        ->update([
                            $column => DB::raw("CAST($column / 10000 AS SIGNED)")
                        ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // A reversão de uma correção de dados é complexa e perigosa.
        // Como os valores originais foram perdidos, não é possível reverter com precisão.
    }
};
