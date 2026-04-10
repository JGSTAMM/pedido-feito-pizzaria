<?php

namespace Database\Seeders;

use App\Models\Neighborhood;
use Illuminate\Database\Seeder;

class NeighborhoodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            "Torres" => [
                "Centro" => 12,
                "Beira mar" => 12,
                "Predial" => 12,
                "Centenário" => 15,
                "Curtume" => 12,
                "Campo bonito" => 40,
                "Dunas" => 12,
                "Engenho Velho" => 15,
                "Faxinal" => 20,
                "Faxinal Zena" => 25,
                "Faxinal pele" => 35,
                "Faxina Motel" => 30,
                "Tamburiki" => 45,
                "Getúlio Vargas" => 12,
                "Guarita" => 12,
                "Igra Norte" => 13,
                "Igra Sul" => 13,
                "Itapeva" => 50,
                "Itapeva Sul" => 50,
                "Jacaré" => ["preco" => 25, "observacao" => "início"],
                "Balonismo" => 12,
                "Porto Alegre" => 12,
                "Riacho Doce" => 12,
                "São Jorge" => 18,
                "Salinas 1" => 15,
                "Salinas 2" => 25,
                "São Francisco" => 12,
                "São Brás" => 60,
                "Stan" => 12,
                "Vila São João" => ["preco" => 25, "observacao" => "até Davi"],
                "Reserva das águas" => 25,
                "Outro condomínio" => 20
            ],
            "Passo de Torres" => [
                "Centro" => 15,
                "Progresso" => 15,
                "Estaleiro" => 15,
                "Silveira" => 15,
                "Novo passo" => 20,
                "Bosque" => 25,
                "Alto feliz" => 18,
                "Passárgada" => 18,
                "Barra Velha" => 20,
                "Praia Azul" => 25,
                "Caravelle" => 25,
                "Mirratorres" => 25,
                "Jardim América" => 25,
                "Pérola" => 35,
                "Ribeiro" => 45,
                "Bella Torres" => 50
            ]
        ];

        foreach ($data as $city => $neighborhoods) {
            foreach ($neighborhoods as $name => $info) {
                // Determine price and observation
                $deliveryFee = is_array($info) ? $info['preco'] : $info;
                $observation = is_array($info) && isset($info['observacao']) ? $info['observacao'] : null;

                Neighborhood::firstOrCreate(
                    [
                        'name' => $name,
                        'city' => $city
                    ],
                    [
                        'delivery_fee' => $deliveryFee,
                        'observation' => $observation
                    ]
                );
            }
        }
    }
}
