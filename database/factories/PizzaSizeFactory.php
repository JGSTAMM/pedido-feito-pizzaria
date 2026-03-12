<?php

namespace Database\Factories;

use App\Models\PizzaSize;
use Illuminate\Database\Eloquent\Factories\Factory;

class PizzaSizeFactory extends Factory
{
    protected $model = PizzaSize::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word,
            'slices' => 8,
            'max_flavors' => 2,
            'is_special_broto_rule' => false,
        ];
    }
}
