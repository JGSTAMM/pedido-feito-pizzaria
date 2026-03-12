<?php

namespace App\Services;

use App\Models\PizzaSize;
use App\Models\PizzaFlavor;

class PizzaPriceService
{
    /**
     * Calculate the price of a pizza based on size and selected flavors.
     *
     * @param string $sizeId
     * @param array $flavorIds
     * @return float
     */
    public function calculateItemPrice(string $sizeId, array $flavorIds): float
    {
        $size = PizzaSize::find($sizeId);
        
        if (!$size) {
            return 0.0;
        }

        $flavors = PizzaFlavor::whereIn('id', $flavorIds)->get();
        
        if ($flavors->isEmpty()) {
            return 0.0;
        }

        // Rule: Broto (Half price + 5.00)
        // Note: Assuming "Broto" is identified by is_special_broto_rule flag.
        if ($size->is_special_broto_rule) {
            // Broto has only 1 flavor, but if multiple are passed, logic says:
            // "Only 1 flavor" in business rules.
            // If technically multiple passed, we might just take the first one or average?
            // Rule says: (Flavor Price / 2) + Fixed Fee ($5.00).
            // We'll use the first flavor's price as per logic "flavors->first()".
            return ($flavors->first()->base_price / 2) + 5.00;
        }

        // Rule: Large (Max value)
        // Price Rule: Equals the HIGHEST value among selected flavors.
        return (float) $flavors->max('base_price');
    }
}
