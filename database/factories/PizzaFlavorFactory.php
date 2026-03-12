<?php

namespace Database\Factories;

use App\Models\PizzaFlavor;
use Illuminate\Database\Eloquent\Factories\Factory;

class PizzaFlavorFactory extends Factory
{
    protected $model = PizzaFlavor::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence,
            'base_price' => $this->faker->randomFloat(2, 20, 100),
            'is_active' => true,
        ];
    }
}
