<?php

namespace Database\Seeders;

use App\Models\PizzaFlavor;
use Illuminate\Database\Seeder;

class PizzaFlavorIngredientsSeeder extends Seeder
{
    /**
     * Official Sr. & Sra. Lucchese menu ingredients map.
     * Savory pizzas (salgadas) include the standard base (Molho sugo, Queijo mussarela).
     *
     * @return array<string, array<int, string>>
     */
    public static function definitions(): array
    {
        $baseSalgada = ['Molho sugo', 'Queijo mussarela'];

        $salgadas = [
            'Mussarela' => ['Molho sugo', 'Queijo mussarela', 'Orégano'],
            'Bacon' => [...$baseSalgada, 'Bacon', 'Orégano'],
            'Calabresa' => [...$baseSalgada, 'Calabresa', 'Orégano', 'Cebola (opcional)'],
            'Vegetariana' => [...$baseSalgada, 'Palmito', 'Milho', 'Ervilha', 'Orégano'],
            'Palmito' => [...$baseSalgada, 'Palmito', 'Orégano'],
            'Alho' => [...$baseSalgada, 'Alho no azeite de oliva', 'Orégano'],
            'Marguerita' => [...$baseSalgada, 'Tomate', 'Manjericão'],
            'Milho' => [...$baseSalgada, 'Milho', 'Orégano'],
            'Napolitana' => [...$baseSalgada, 'Tomate', 'Presunto', 'Parmesão', 'Orégano'],
            'Portuguesa' => [...$baseSalgada, 'Presunto', 'Ovos', 'Azeitona verde', 'Pimentões coloridos', 'Orégano'],
            'Atum' => [...$baseSalgada, 'Atum', 'Orégano', 'Cebola (opcional)'],
            'Champignon' => [...$baseSalgada, 'Champignon puxado na manteiga', 'Orégano'],
            'Lombo' => [...$baseSalgada, 'Lombo canadense', 'Orégano'],
            'Quatro Queijos' => [...$baseSalgada, 'Provolone', 'Gorgonzola', 'Catupiry', 'Orégano'],
            'Cinco Queijos' => [...$baseSalgada, 'Provolone', 'Gorgonzola', 'Catupiry', 'Cheddar', 'Orégano'],
            'Quatro Queijos com Bacon' => [...$baseSalgada, 'Provolone', 'Gorgonzola', 'Catupiry', 'Bacon', 'Orégano'],
            'Salame' => [...$baseSalgada, 'Salame italiano', 'Pimentões coloridos', 'Orégano'],
            'Tomate Seco' => [...$baseSalgada, 'Tomate seco', 'Orégano', 'Rúcula'],
            'Toscana' => [...$baseSalgada, 'Calabresa ralada', 'Ovos', 'Azeitona verde', 'Pimentões coloridos', 'Orégano'],
            'Brócolis' => [...$baseSalgada, 'Brócolis puxado na manteiga', 'Orégano'],
            'Frango com Catupiry' => [...$baseSalgada, 'Frango ralado', 'Catupiry', 'Orégano'],
            'Frango Especial' => [...$baseSalgada, 'Frango ralado', 'Bacon', 'Milho', 'Catupiry', 'Orégano'],
            'Putanesca' => [...$baseSalgada, 'Atum', 'Alcaparras', 'Azeitona verde', 'Azeitona preta', 'Orégano'],
            'Strogonoff de Carne' => [...$baseSalgada, 'Strogonoff de carne', 'Orégano'],
            'Strogonoff de Frango' => [...$baseSalgada, 'Strogonoff de frango', 'Orégano'],
            'Lombo com Abacaxi' => [...$baseSalgada, 'Lombo canadense', 'Abacaxi', 'Orégano'],
            'Coração' => [...$baseSalgada, 'Coração com especiarias', 'Orégano'],
            'Pepperoni' => [...$baseSalgada, 'Pepperoni', 'Orégano'],
            'Siciliana' => [...$baseSalgada, 'Bacon', 'Tomate', 'Champignon', 'Cebola caramelizada', 'Orégano'],
            'Filé' => [...$baseSalgada, 'Filé puxado na manteiga', 'Orégano'],
            'Filé com Gorgonzola' => [...$baseSalgada, 'Filé puxado na manteiga', 'Gorgonzola', 'Orégano'],
            'Filé com Cebola' => [...$baseSalgada, 'Filé puxado na manteiga', 'Cebola caramelizada', 'Orégano'],
            'Filé com Alho' => [...$baseSalgada, 'Filé puxado na manteiga', 'Alho', 'Orégano'],
            'Siri' => [...$baseSalgada, 'Siri com especiarias', 'Manjericão'],
            'Camarão' => [...$baseSalgada, 'Camarão com especiarias', 'Manjericão'],
            'Camarão ao 4 Queijos' => [...$baseSalgada, 'Provolone', 'Gorgonzola', 'Catupiry', 'Camarão com especiarias', 'Manjericão'],
        ];

        $doces = [
            'Chocolate Preto' => ['Chocolate preto'],
            'Chocolate Branco' => ['Chocolate branco'],
            'Chocolate Preto e Branco' => ['Chocolate preto', 'Chocolate branco'],
            'Chocolate Preto com Morango' => ['Chocolate preto', 'Morango'],
            'Chocolate Branco com Morango' => ['Chocolate branco', 'Morango'],
            'Chocolate Preto com Paçoca' => ['Chocolate preto', 'Paçoca'],
            'Chocolate Branco com Paçoca' => ['Chocolate branco', 'Paçoca'],
            'Chocolate Preto com Confete' => ['Chocolate preto', 'Confete colorido'],
            'Chocolate Branco com Confete' => ['Chocolate branco', 'Confete colorido'],
            'Floresta Negra' => ['Chocolate preto', 'Chocolate branco', 'Cereja'],
            'Banana com Doce de Leite' => ['Banana', 'Doce de leite', 'Mussarela', 'Canela'],
            'Chocolate Preto com Abacaxi' => ['Chocolate preto', 'Abacaxi'],
            'Chocolate Branco com Abacaxi' => ['Chocolate branco', 'Abacaxi'],
        ];

        return array_merge($salgadas, $doces);
    }

    public function run(): void
    {
        foreach (self::definitions() as $flavorName => $ingredientNames) {
            $flavor = PizzaFlavor::where('name', $flavorName)->first();
            if (! $flavor) {
                continue;
            }

            $structured = array_map(
                fn (string $name) => ['name' => $name, 'is_available' => true],
                $ingredientNames
            );

            $flavor->update([
                'ingredients_json' => $structured,
            ]);
        }
    }
}
