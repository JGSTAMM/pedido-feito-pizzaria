<?php

namespace App\Application\Pricing;

use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use InvalidArgumentException;

class HybridPizzaPricingService
{
    private const BROTO_FIXED_FEE = 5.00;

    public function calculate(string $sizeId, array $flavorIds): float
    {
        $size = PizzaSize::find($sizeId);

        if (! $size) {
            throw new InvalidArgumentException("Invalid pizza size: {$sizeId}");
        }

        $uniqueFlavorIds = array_values(array_unique(array_filter($flavorIds, fn ($id) => is_scalar($id) && trim((string) $id) !== '')));
        if (empty($uniqueFlavorIds)) {
            throw new InvalidArgumentException('At least one pizza flavor must be provided.');
        }

        $flavors = PizzaFlavor::whereIn('id', $uniqueFlavorIds)->get();

        if ($flavors->isEmpty() || $flavors->count() !== count($uniqueFlavorIds)) {
            throw new InvalidArgumentException('One or more selected pizza flavors do not exist.');
        }

        if ($size->max_flavors !== null && count($flavorIds) > (int) $size->max_flavors) {
            throw new InvalidArgumentException("Number of flavors exceeds the maximum allowed ({$size->max_flavors}) for size {$size->name}.");
        }

        if ($size->is_special_broto_rule) {
            return ((float) $flavors->max('base_price') / 2) + self::BROTO_FIXED_FEE;
        }

        return (float) $flavors->max('base_price');
    }
}
