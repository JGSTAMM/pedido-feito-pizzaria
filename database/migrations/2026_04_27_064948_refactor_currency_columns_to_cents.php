<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'pizza_flavors' => [
                'base_price' => ['nullable' => false]
            ],
            'products' => [
                'price' => ['nullable' => false]
            ],
            'neighborhoods' => [
                'delivery_fee' => ['nullable' => false, 'default' => 0]
            ],
            'orders' => [
                'total_amount' => ['nullable' => false, 'default' => 0],
                'delivery_fee' => ['nullable' => false, 'default' => 0],
                'change_amount' => ['nullable' => true]
            ],
            'order_items' => [
                'unit_price' => ['nullable' => false, 'default' => 0],
                'subtotal' => ['nullable' => false]
            ],
            'payments' => [
                'amount' => ['nullable' => false]
            ],
            'cash_registers' => [
                'opening_balance' => ['nullable' => false],
                'closing_balance' => ['nullable' => true],
                'calculated_balance' => ['nullable' => true],
                'difference' => ['nullable' => true],
                'total_sales' => ['nullable' => false, 'default' => 0],
            ],
        ];

        foreach ($tables as $table => $columns) {
            foreach ($columns as $column => $options) {
                // Obter tipo real do banco (Schema::getColumnType pode retornar abstrações)
                $currentType = Schema::getColumnType($table, $column);
                
                // Se já for big_int ou integer, ignorar para evitar duplicação de valores
                if (in_array($currentType, ['integer', 'bigint'])) {
                    continue;
                }

                // 1. Garantir que não existam NULLs em colunas que serão NOT NULL
                if (!isset($options['nullable']) || !$options['nullable']) {
                    DB::table($table)->whereNull($column)->update([$column => $options['default'] ?? 0]);
                }

                // 2. Multiplicar valores existentes por 100
                DB::table($table)->update([
                    $column => DB::raw("ROUND($column * 100, 0)")
                ]);

                // 3. Alterar tipo da coluna para BIGINT para evitar overflow e problemas de truncamento
                Schema::table($table, function (Blueprint $tableGroup) use ($column, $options) {
                    $change = $tableGroup->bigInteger($column);
                    
                    if (isset($options['nullable']) && $options['nullable']) {
                        $change->nullable();
                    } else {
                        $change->nullable(false);
                    }

                    if (isset($options['default'])) {
                        $change->default($options['default']);
                    }

                    $change->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'pizza_flavors' => [
                'base_price' => ['nullable' => false]
            ],
            'products' => [
                'price' => ['nullable' => false]
            ],
            'neighborhoods' => [
                'delivery_fee' => ['nullable' => false, 'default' => 0]
            ],
            'orders' => [
                'total_amount' => ['nullable' => false, 'default' => 0],
                'delivery_fee' => ['nullable' => false, 'default' => 0],
                'change_amount' => ['nullable' => true]
            ],
            'order_items' => [
                'unit_price' => ['nullable' => false, 'default' => 0],
                'subtotal' => ['nullable' => false]
            ],
            'payments' => [
                'amount' => ['nullable' => false]
            ],
            'cash_registers' => [
                'opening_balance' => ['nullable' => false],
                'closing_balance' => ['nullable' => true],
                'calculated_balance' => ['nullable' => true],
                'difference' => ['nullable' => true],
                'total_sales' => ['nullable' => false, 'default' => 0],
            ],
        ];

        foreach ($tables as $table => $columns) {
            foreach ($columns as $column => $options) {
                $currentType = Schema::getColumnType($table, $column);

                if (!in_array($currentType, ['integer', 'bigint'])) {
                    continue;
                }

                // 1. Alterar tipo da coluna de volta para DECIMAL
                Schema::table($table, function (Blueprint $tableGroup) use ($column, $options) {
                    $change = $tableGroup->decimal($column, 10, 2);
                    
                    if (isset($options['nullable']) && $options['nullable']) {
                        $change->nullable();
                    } else {
                        $change->nullable(false);
                    }

                    if (isset($options['default'])) {
                        $change->default($options['default']);
                    }

                    $change->change();
                });

                // 2. Dividir valores por 100
                DB::table($table)->update([
                    $column => DB::raw("$column / 100")
                ]);
            }
        }
    }
};
