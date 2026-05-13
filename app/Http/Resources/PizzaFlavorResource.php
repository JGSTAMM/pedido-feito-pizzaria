<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PizzaFlavorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $ingredients = $this->ingredients;
        if (!empty($this->ingredients_json)) {
            $ingredients = collect($this->ingredients_json)
                ->filter(fn($i) => ($i['is_available'] ?? true) === true)
                ->pluck('name')
                ->implode(', ');
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'ingredients' => $ingredients,
            'ingredients_json' => $this->ingredients_json,
            'flavor_category' => $this->flavor_category,
            'base_price' => $this->base_price,
            'image_url' => $this->image_url,
        ];
    }
}
