<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PizzaFlavor extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'description', 'ingredients', 'ingredients_json', 'flavor_category', 'base_price', 'is_active', 'is_active_delivery', 'is_active_pos', 'show_on_digital_menu', 'image'];

    protected $casts = [
        'is_active'            => 'boolean',
        'is_active_delivery'   => 'boolean',
        'is_active_pos'        => 'boolean',
        'show_on_digital_menu' => 'boolean',
        'ingredients_json'     => 'array',
    ];

    protected $appends = ['image_url'];

    protected function basePrice(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => (int) round($value * 100),
        );
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => $this->image ? asset('storage/'.$this->image) : null);
    }

    /**
     * Format flavor payload consistently for POS, Floor, and Waiter builders.
     *
     * @return array<string, mixed>
     */
    public function toStaffBuilderArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => (float) $this->base_price,
            'ingredients' => $this->ingredients,
            'ingredients_json' => $this->ingredients_json,
            'description' => $this->description,
            'flavor_category' => $this->flavor_category,
            'category' => 'Pizzas',
            'image_url' => $this->image_url,
            'type' => 'pizza_flavor',
        ];
    }

    /**
     * Build a human-readable summary string from structured ingredients_json.
     *
     * @param  array<int, array<string, mixed>>|null  $ingredientsJson
     */
    public static function formatIngredientsSummary(?array $ingredientsJson): ?string
    {
        if (empty($ingredientsJson)) {
            return null;
        }

        $names = collect($ingredientsJson)
            ->filter(fn ($item) => (bool) ($item['is_available'] ?? true))
            ->map(fn ($item) => trim((string) ($item['name'] ?? '')))
            ->filter()
            ->values();

        return $names->isNotEmpty() ? $names->implode(', ') : null;
    }
}
