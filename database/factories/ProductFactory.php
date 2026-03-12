<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $categories = ['Drinks', 'Desserts', 'Sides', 'Beverages'];
        
        return [
            'name' => $this->faker->words(2, true),
            'price' => $this->faker->randomFloat(2, 3, 25),
            'category' => $this->faker->randomElement($categories),
        ];
    }
}
