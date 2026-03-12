<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Neighborhood;

class NeighborhoodSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing neighborhoods
        Neighborhood::truncate();

        $neighborhoods = [
            // Torres
            ['name' => 'Centro', 'delivery_fee' => 12],
            ['name' => 'Beira Mar', 'delivery_fee' => 12],
            ['name' => 'Predial', 'delivery_fee' => 12],
            ['name' => 'Centenário', 'delivery_fee' => 15],
            ['name' => 'Curtume', 'delivery_fee' => 12],
            ['name' => 'Campo Bonito', 'delivery_fee' => 40],
            ['name' => 'Dunas', 'delivery_fee' => 12],
            ['name' => 'Engenho Velho', 'delivery_fee' => 15],
            ['name' => 'Faxinal', 'delivery_fee' => 20],
            ['name' => 'Faxinal Zena', 'delivery_fee' => 25],
            ['name' => 'Faxinal Pele', 'delivery_fee' => 35],
            ['name' => 'Faxinal Motel', 'delivery_fee' => 30],
            ['name' => 'Tamburiki', 'delivery_fee' => 45],
            ['name' => 'Getúlio Vargas', 'delivery_fee' => 12],
            ['name' => 'Guarita', 'delivery_fee' => 12],
            ['name' => 'Igra Norte', 'delivery_fee' => 13],
            ['name' => 'Igra Sul', 'delivery_fee' => 13],
            ['name' => 'Itapeva', 'delivery_fee' => 50],
            ['name' => 'Itapeva Sul', 'delivery_fee' => 50],
            ['name' => 'Jacaré', 'delivery_fee' => 25],
            ['name' => 'Balonismo', 'delivery_fee' => 12],
            ['name' => 'Porto Alegre', 'delivery_fee' => 12],
            ['name' => 'Riacho Doce', 'delivery_fee' => 12],
            ['name' => 'São Jorge', 'delivery_fee' => 18],
            ['name' => 'Salinas 1', 'delivery_fee' => 15],
            ['name' => 'Salinas 2', 'delivery_fee' => 25],
            ['name' => 'São Francisco', 'delivery_fee' => 12],
            ['name' => 'São Brás', 'delivery_fee' => 60],
            ['name' => 'Stan', 'delivery_fee' => 12],
            ['name' => 'Vila São João', 'delivery_fee' => 25],
            ['name' => 'Reserva das Águas', 'delivery_fee' => 25],
            ['name' => 'Outro Condomínio', 'delivery_fee' => 20],

            // Passo de Torres
            ['name' => 'Passo de Torres - Centro', 'delivery_fee' => 15],
            ['name' => 'Passo de Torres - Progresso', 'delivery_fee' => 15],
            ['name' => 'Passo de Torres - Estaleiro', 'delivery_fee' => 15],
            ['name' => 'Passo de Torres - Silveira', 'delivery_fee' => 15],
            ['name' => 'Passo de Torres - Novo Passo', 'delivery_fee' => 20],
            ['name' => 'Passo de Torres - Bosque', 'delivery_fee' => 25],
            ['name' => 'Passo de Torres - Alto Feliz', 'delivery_fee' => 18],
            ['name' => 'Passo de Torres - Passárgada', 'delivery_fee' => 18],
            ['name' => 'Passo de Torres - Barra Velha', 'delivery_fee' => 20],
            ['name' => 'Passo de Torres - Praia Azul', 'delivery_fee' => 25],
            ['name' => 'Passo de Torres - Caravelle', 'delivery_fee' => 25],
            ['name' => 'Passo de Torres - Mirratorres', 'delivery_fee' => 25],
            ['name' => 'Passo de Torres - Jardim América', 'delivery_fee' => 25],
            ['name' => 'Passo de Torres - Pérola', 'delivery_fee' => 35],
            ['name' => 'Passo de Torres - Ribeiro', 'delivery_fee' => 45],
            ['name' => 'Passo de Torres - Bella Torres', 'delivery_fee' => 50],
        ];

        foreach ($neighborhoods as $n) {
            Neighborhood::create($n);
        }
    }
}
