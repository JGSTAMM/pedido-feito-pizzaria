<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PizzaPriceService;
use App\Models\PizzaSize;
use App\Models\PizzaFlavor;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PizzaPriceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PizzaPriceService();
    }

    public function test_calculate_standard_pizza_single_flavor()
    {
        $size = PizzaSize::factory()->create([
            'is_special_broto_rule' => false,
        ]);
        
        $flavor = PizzaFlavor::factory()->create([
            'base_price' => 50.00,
        ]);

        $price = $this->service->calculateItemPrice($size->id, [$flavor->id]);

        $this->assertEquals(50.00, $price);
    }

    public function test_calculate_standard_pizza_multiple_flavors_takes_highest_price()
    {
        $size = PizzaSize::factory()->create([
            'is_special_broto_rule' => false,
        ]);
        
        $flavor1 = PizzaFlavor::factory()->create(['base_price' => 40.00]);
        $flavor2 = PizzaFlavor::factory()->create(['base_price' => 60.00]); // Highest
        $flavor3 = PizzaFlavor::factory()->create(['base_price' => 55.00]);

        $price = $this->service->calculateItemPrice($size->id, [$flavor1->id, $flavor2->id, $flavor3->id]);

        $this->assertEquals(60.00, $price);
    }

    public function test_calculate_broto_pizza_single_flavor()
    {
        $size = PizzaSize::factory()->create([
            'is_special_broto_rule' => true,
        ]);
        
        $flavor = PizzaFlavor::factory()->create([
            'base_price' => 50.00,
        ]);

        // Logic: (50 / 2) + 5 = 25 + 5 = 30
        $price = $this->service->calculateItemPrice($size->id, [$flavor->id]);

        $this->assertEquals(30.00, $price);
    }

    public function test_calculate_returns_zero_if_size_not_found()
    {
        $flavor = PizzaFlavor::factory()->create(['base_price' => 50.00]);
        $price = $this->service->calculateItemPrice(999, [$flavor->id]);
        $this->assertEquals(0.0, $price);
    }

    public function test_calculate_returns_zero_if_no_flavors_provided()
    {
        $size = PizzaSize::factory()->create();
        $price = $this->service->calculateItemPrice($size->id, []);
        $this->assertEquals(0.0, $price);
    }
}
