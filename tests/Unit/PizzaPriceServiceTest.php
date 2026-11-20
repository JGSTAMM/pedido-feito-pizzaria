<?php

namespace Tests\Unit;

use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Services\PizzaPriceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PizzaPriceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PizzaPriceService::class);
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
            'max_flavors' => 3,
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

    public function test_calculate_throws_exception_if_size_not_found()
    {
        $this->expectException(\InvalidArgumentException::class);
        $flavor = PizzaFlavor::factory()->create(['base_price' => 50.00]);
        $this->service->calculateItemPrice('00000000-0000-0000-0000-000000000999', [$flavor->id]);
    }

    public function test_calculate_throws_exception_if_no_flavors_provided()
    {
        $this->expectException(\InvalidArgumentException::class);
        $size = PizzaSize::factory()->create();
        $this->service->calculateItemPrice($size->id, []);
    }

    public function test_calculate_broto_pizza_multiple_flavors_takes_highest_price()
    {
        $size = PizzaSize::factory()->create([
            'is_special_broto_rule' => true,
            'max_flavors' => 2,
        ]);

        $flavorCheap = PizzaFlavor::factory()->create(['base_price' => 40.00]);
        $flavorExpensive = PizzaFlavor::factory()->create(['base_price' => 80.00]);

        // When cheap flavor is passed first
        $price1 = $this->service->calculateItemPrice($size->id, [$flavorCheap->id, $flavorExpensive->id]);
        // Calculation must take highest: (80 / 2) + 5 = 45.00
        $this->assertEquals(45.00, $price1);

        // When expensive flavor is passed first
        $price2 = $this->service->calculateItemPrice($size->id, [$flavorExpensive->id, $flavorCheap->id]);
        $this->assertEquals(45.00, $price2);
    }

    public function test_calculate_throws_when_flavors_exceed_max_flavors()
    {
        $size = PizzaSize::factory()->create([
            'name' => 'Broto',
            'max_flavors' => 2,
        ]);

        $f1 = PizzaFlavor::factory()->create(['base_price' => 40.00]);
        $f2 = PizzaFlavor::factory()->create(['base_price' => 50.00]);
        $f3 = PizzaFlavor::factory()->create(['base_price' => 60.00]);

        $this->expectException(\InvalidArgumentException::class);
        $this->service->calculateItemPrice($size->id, [$f1->id, $f2->id, $f3->id]);
    }
}
