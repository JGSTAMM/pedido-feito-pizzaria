<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Table;
use App\Models\PizzaSize;
use App\Models\PizzaFlavor;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     * JSON Oficial: Pedido Feito
     */
    public function run(): void
    {
        // ── Users ──
        User::factory()->create([
            'name' => 'Garçom Pedido Feito',
            'email' => 'waiter@pedidofeito.com',
            'password' => bcrypt('password'),
            'role' => 'waiter',
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@pedidofeito.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        // ── Pizza Sizes ──
        PizzaSize::create([
            'name' => 'Broto',
            'slices' => 6,
            'max_flavors' => 1,
            'is_special_broto_rule' => true,
        ]);

        PizzaSize::create([
            'name' => 'Grande',
            'slices' => 12,
            'max_flavors' => 3,
            'is_special_broto_rule' => false,
        ]);

        // =============================================
        // PIZZAS SALGADAS (id 1-36)
        // Base padrão: Molho Artesanal e Queijo Mussarela
        // =============================================
        $salgadas = [
            ['name' => 'Mussarela',                   'ingredients' => 'Mussarela e orégano',                                                                             'base_price' => 70.00],
            ['name' => 'Bacon',                        'ingredients' => 'Bacon e orégano',                                                                                  'base_price' => 75.00],
            ['name' => 'Calabresa',                    'ingredients' => 'Calabresa e orégano (cebola opcional)',                                                            'base_price' => 75.00],
            ['name' => 'Vegetariana',                  'ingredients' => 'Palmito, milho, ervilha e orégano',                                                               'base_price' => 75.00],
            ['name' => 'Palmito',                      'ingredients' => 'Palmito e orégano',                                                                                'base_price' => 75.00],
            ['name' => 'Alho',                         'ingredients' => 'Alho no azeite de oliva e orégano',                                                               'base_price' => 75.00],
            ['name' => 'Marguerita',                   'ingredients' => 'Tomate e manjericão',                                                                              'base_price' => 75.00],
            ['name' => 'Milho',                        'ingredients' => 'Milho e orégano',                                                                                  'base_price' => 75.00],
            ['name' => 'Napolitana',                   'ingredients' => 'Tomate, presunto, parmesão e orégano',                                                            'base_price' => 75.00],
            ['name' => 'Portuguesa',                   'ingredients' => 'Presunto, ovos, azeitona verde, pimentões coloridos e orégano',                                   'base_price' => 80.00],
            ['name' => 'Atum',                         'ingredients' => 'Atum e orégano (cebola opcional)',                                                                'base_price' => 85.00],
            ['name' => 'Champignon',                   'ingredients' => 'Champignon puxado na manteiga e orégano',                                                         'base_price' => 80.00],
            ['name' => 'Lombo',                        'ingredients' => 'Lombo canadense e orégano',                                                                        'base_price' => 80.00],
            ['name' => 'Quatro Queijos',               'ingredients' => 'Provolone, gorgonzola, catupiry e orégano',                                                       'base_price' => 80.00],
            ['name' => 'Cinco Queijos',                'ingredients' => 'Provolone, gorgonzola, catupiry, cheddar e orégano',                                              'base_price' => 80.00],
            ['name' => 'Quatro Queijos com Bacon',     'ingredients' => 'Provolone, gorgonzola, catupiry, bacon e orégano',                                                'base_price' => 85.00],
            ['name' => 'Salame',                       'ingredients' => 'Salame italiano, pimentões coloridos e orégano',                                                  'base_price' => 80.00],
            ['name' => 'Tomate Seco',                  'ingredients' => 'Tomate seco, orégano e rúcula',                                                                    'base_price' => 80.00],
            ['name' => 'Toscana',                      'ingredients' => 'Calabresa ralada, ovos, azeitona verde, pimentões coloridos e orégano',                           'base_price' => 80.00],
            ['name' => 'Brócolis',                     'ingredients' => 'Brócolis puxado na manteiga e orégano',                                                           'base_price' => 80.00],
            ['name' => 'Frango com Catupiry',          'ingredients' => 'Frango ralado, catupiry e orégano',                                                               'base_price' => 80.00],
            ['name' => 'Frango Especial',              'ingredients' => 'Frango ralado, bacon, milho, catupiry e orégano',                                                 'base_price' => 85.00],
            ['name' => 'Putanesca',                    'ingredients' => 'Atum, alcaparras, azeitona verde, azeitona preta e orégano',                                      'base_price' => 85.00],
            ['name' => 'Strogonoff de Carne',          'ingredients' => 'Strogonoff de carne e orégano',                                                                    'base_price' => 85.00],
            ['name' => 'Strogonoff de Frango',         'ingredients' => 'Strogonoff de frango e orégano',                                                                   'base_price' => 85.00],
            ['name' => 'Lombo com Abacaxi',            'ingredients' => 'Lombo canadense, abacaxi e orégano',                                                              'base_price' => 85.00],
            ['name' => 'Coração',                      'ingredients' => 'Coração com especiarias e orégano',                                                               'base_price' => 90.00],
            ['name' => 'Pepperoni',                    'ingredients' => 'Pepperoni e orégano',                                                                              'base_price' => 90.00],
            ['name' => 'Siciliana',                    'ingredients' => 'Bacon, tomate, champignon, cebola caramelizada e orégano',                                        'base_price' => 90.00],
            ['name' => 'Filé',                         'ingredients' => 'Filé puxado na manteiga e orégano',                                                               'base_price' => 95.00],
            ['name' => 'Filé com Gorgonzola',          'ingredients' => 'Filé puxado na manteiga, gorgonzola e orégano',                                                   'base_price' => 95.00],
            ['name' => 'Filé com Cebola',              'ingredients' => 'Filé puxado na manteiga, cebola caramelizado e orégano',                                          'base_price' => 95.00],
            ['name' => 'Filé com Alho',                'ingredients' => 'Filé puxado na manteiga, alho e orégano',                                                         'base_price' => 95.00],
            ['name' => 'Siri',                         'ingredients' => 'Siri com especiarias e manjericão',                                                                'base_price' => 100.00],
            ['name' => 'Camarão',                      'ingredients' => 'Camarão com especiarias e manjericão',                                                             'base_price' => 100.00],
            ['name' => 'Camarão ao 4 Queijos',         'ingredients' => 'Provolone, gorgonzola, catupiry, camarão com especiarias e manjericão',                            'base_price' => 105.00],
        ];

        foreach ($salgadas as $flavor) {
            PizzaFlavor::create(array_merge($flavor, [
                'description' => $flavor['ingredients'],
                'flavor_category' => 'salgada',
            ]));
        }

        // =============================================
        // PIZZAS DOCES (id 37-49)
        // Sem base padrão (sem molho/mussarela)
        // =============================================
        $doces = [
            ['name' => 'Chocolate Preto',                'ingredients' => 'Chocolate preto',                                    'base_price' => 75.00],
            ['name' => 'Chocolate Branco',               'ingredients' => 'Chocolate branco',                                   'base_price' => 75.00],
            ['name' => 'Chocolate Preto e Branco',       'ingredients' => 'Chocolate preto e chocolate branco',                 'base_price' => 75.00],
            ['name' => 'Chocolate Preto com Morango',    'ingredients' => 'Chocolate preto e morango',                           'base_price' => 80.00],
            ['name' => 'Chocolate Branco com Morango',   'ingredients' => 'Chocolate branco e morango',                          'base_price' => 80.00],
            ['name' => 'Chocolate Preto com Paçoca',     'ingredients' => 'Chocolate preto e paçoca',                            'base_price' => 80.00],
            ['name' => 'Chocolate Branco com Paçoca',    'ingredients' => 'Chocolate branco e paçoca',                           'base_price' => 80.00],
            ['name' => 'Chocolate Preto com Confete',    'ingredients' => 'Chocolate preto e confete colorido',                  'base_price' => 80.00],
            ['name' => 'Chocolate Branco com Confete',   'ingredients' => 'Chocolate branco e confete colorido',                 'base_price' => 80.00],
            ['name' => 'Floresta Negra',                 'ingredients' => 'Chocolate preto, chocolate branco e cereja',          'base_price' => 80.00],
            ['name' => 'Banana com Doce de Leite',       'ingredients' => 'Banana, doce de leite, mussarela e canela',           'base_price' => 80.00],
            ['name' => 'Chocolate Preto com Abacaxi',    'ingredients' => 'Chocolate preto e abacaxi',                           'base_price' => 80.00],
            ['name' => 'Chocolate Branco com Abacaxi',   'ingredients' => 'Chocolate branco com abacaxi',                        'base_price' => 80.00],
        ];

        foreach ($doces as $flavor) {
            PizzaFlavor::create(array_merge($flavor, [
                'description' => $flavor['ingredients'],
                'flavor_category' => 'doce',
            ]));
        }

        // =============================================
        // EXTRAS (Bordas + Pizza do Dia)
        // =============================================
        $extras = [
            ['name' => 'Borda Recheada - Cheddar',            'price' => 20.00, 'category' => 'Extras'],
            ['name' => 'Borda Recheada - Catupiry',            'price' => 20.00, 'category' => 'Extras'],
            ['name' => 'Borda Recheada - Chocolate com Avelã', 'price' => 20.00, 'category' => 'Extras'],
        ];

        $promos = [
            ['name' => 'Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)', 'price' => 70.00, 'category' => 'Promoções'],
        ];

        // =============================================
        // BEBIDAS
        // =============================================
        $bebidas = [
            ['name' => 'Água com/sem Gás',       'price' =>  5.00, 'category' => 'Bebidas'],
            ['name' => 'Refrigerante Lata',      'price' =>  6.00, 'category' => 'Bebidas'],
            ['name' => 'Refrigerante 600ml',     'price' =>  8.00, 'category' => 'Bebidas'],
            ['name' => 'Refrigerante 2L',        'price' => 15.00, 'category' => 'Bebidas'],
            ['name' => 'Suco Lata',              'price' =>  8.00, 'category' => 'Bebidas'],
            ['name' => 'Suco Integral',          'price' =>  8.00, 'category' => 'Bebidas'],
            ['name' => 'Cerveja Lata',           'price' => 10.00, 'category' => 'Bebidas'],
            ['name' => 'Cerveja Latão',          'price' => 12.00, 'category' => 'Bebidas'],
            ['name' => 'Cerveja 600ml',          'price' => 20.00, 'category' => 'Bebidas'],
            ['name' => 'Cerveja Long Neck',      'price' => 15.00, 'category' => 'Bebidas'],
            ['name' => 'Cerveja Artesanal',      'price' => 20.00, 'category' => 'Bebidas'],
        ];

        foreach (array_merge($extras, $promos, $bebidas) as $product) {
            Product::create($product);
        }

        // ── Tables ──
        for ($i = 1; $i <= 10; $i++) {
            Table::create([
                'name' => "Mesa $i",
                'status' => 'available',
            ]);
        }
    }
}
