<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogVariationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Refrigerante Lata',
                'price' => 600,
                'category' => 'Bebidas',
                'variations' => [
                    'Coca cola', 'Coca cola (zero)', 'Fanta Guarana', 'Fanta guarana (zero)', 
                    'Fanta laranja', 'Fanta uva', 'schweppes citrus', 'schweppes citrus (zero)', 
                    'schweppes tonica', 'schweppes tonica (zero)', 'Sprite', 'sprite (zero)'
                ]
            ],
            [
                'name' => 'Refrigerante 2 Litros',
                'price' => 1500,
                'category' => 'Bebidas',
                'variations' => [
                    'coca cola', 'coca cola (zero)', 'sprite', 'sprite (zero)', 'Guarana sarandi'
                ]
            ],
            [
                'name' => 'Refrigerante 600ml',
                'price' => 1000,
                'category' => 'Bebidas',
                'variations' => [
                    'coca cola', 'coca cola (zero)'
                ]
            ],
            [
                'name' => 'Suco',
                'price' => 800,
                'category' => 'Bebidas',
                'variations' => [
                    'Suco de uva integral (copo)', 'Del Valle Pêssego', 'Del Valle Laranja'
                ]
            ],
            [
                'name' => 'Cerveja Latão',
                'price' => 1500,
                'category' => 'Bebidas',
                'variations' => [
                    'Amestel', 'eisenbahn pilsen', 'heineken', 'estrela galicia', 'therezópolis gold'
                ]
            ],
        ];

        foreach ($products as $p) {
            $variationData = [];
            foreach ($p['variations'] as $vName) {
                $variationData[] = [
                    'name' => $vName,
                    'price' => $p['price'] / 100, // Storing as float for frontend/controller compatibility
                    'is_active' => true
                ];
            }

            DB::table('products')->insert([
                'id' => (string) Str::uuid(),
                'name' => $p['name'],
                'price' => $p['price'], // Directly in cents as requested
                'category' => $p['category'],
                'is_active_delivery' => true,
                'is_active_pos' => true,
                'variations' => json_encode($variationData),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
