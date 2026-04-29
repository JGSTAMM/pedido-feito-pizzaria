<?php

namespace App\Services;

use App\Application\Pricing\HybridPizzaPricingService;

class PizzaPriceService
{
    public function __construct(
        private readonly HybridPizzaPricingService $hybridPizzaPricingService,
    ) {}

    /**
     * Calculate the price of a pizza based on size and selected flavors.
     */
    public function calculateItemPrice(string $sizeId, array $flavorIds): float
    {
        return $this->hybridPizzaPricingService->calculate($sizeId, $flavorIds);
    }
}
