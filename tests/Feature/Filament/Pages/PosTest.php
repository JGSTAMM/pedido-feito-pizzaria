<?php

namespace Tests\Feature\Filament\Pages;

use App\Filament\Pages\Pos;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class PosTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_render_pos_page()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(Pos::getUrl())
            ->assertSuccessful();
    }

    public function test_can_add_product_to_cart()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Coke',
            'price' => 5.00,
            'category' => 'Drinks'
        ]);

        Livewire::actingAs($user)
            ->test(Pos::class)
            ->call('addProductToCart', $product->id)
            ->assertSet('total', 5.00)
            ->assertSee('Coke');
    }

    public function test_can_add_pizza_to_cart()
    {
        $user = User::factory()->create();
        $size = PizzaSize::factory()->create(['name' => 'Large', 'slices' => 8, 'max_flavors' => 2]);
        $flavor = PizzaFlavor::factory()->create(['name' => 'Pepperoni', 'base_price' => 40.00]);

        Livewire::actingAs($user)
            ->test(Pos::class)
            ->call('openPizzaBuilder', $flavor->id)
            ->assertSet('showPizzaModal', true)
            ->call('selectPizzaSize', $size->id)
            ->call('addPizzaToCart')
            ->assertSet('showPizzaModal', false)
            ->assertSet('total', 40.00); // Assuming standard rule (max of flavors)
    }

    public function test_checkout_clears_cart_and_creates_order()
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 10.00]);

        Livewire::actingAs($user)
            ->test(Pos::class)
            ->call('addProductToCart', $product->id)
            ->call('checkout')
            ->assertSet('cart', [])
            ->assertSet('total', 0.00)
            ->assertNotified('Venda realizada com sucesso!');

        $this->assertDatabaseHas('orders', [
            'total_amount' => 10.00
        ]);
    }
}
