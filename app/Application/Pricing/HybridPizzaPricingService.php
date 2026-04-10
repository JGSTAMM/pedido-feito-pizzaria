<?php

namespace App\Application\Pricing;

use App\Models\PizzaFlavor;
use App\Models\PizzaSize;

class HybridPizzaPricingService
{
    private const BROTO_FIXED_FEE = 5.00;

    public function calculate(string $sizeId, array $flavorIds): float
    {
        $size = PizzaSize::find($sizeId);

        if (!$size) {
            return 0.0;
        }

        $flavors = PizzaFlavor::whereIn('id', $flavorIds)->get();

        if ($flavors->isEmpty()) {
            return 0.0;
        }

        if ($size->is_special_broto_rule) {
            return ((float) $flavors->first()->base_price / 2) + self::BROTO_FIXED_FEE;
        }

        return (float) $flavors->max('base_price');
    }
}
