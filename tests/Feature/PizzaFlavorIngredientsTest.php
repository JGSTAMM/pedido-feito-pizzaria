<?php

namespace Tests\Feature;

use App\Models\PizzaFlavor;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\PizzaFlavorIngredientsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PizzaFlavorIngredientsTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithRole(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
        ]);
    }

    public function test_seeder_populates_ingredients_json_for_all_49_official_flavors_idempotently(): void
    {
        $this->seed(DatabaseSeeder::class);

        $definitions = PizzaFlavorIngredientsSeeder::definitions();
        $this->assertCount(49, $definitions);

        foreach ($definitions as $flavorName => $expectedIngredients) {
            $flavor = PizzaFlavor::where('name', $flavorName)->first();
            $this->assertNotNull($flavor, "Expected seeded flavor [{$flavorName}] to exist.");
            $this->assertIsArray($flavor->ingredients_json);

            $actualNames = collect($flavor->ingredients_json)->pluck('name')->all();
            $this->assertSame($expectedIngredients, $actualNames, "Mismatch for flavor [{$flavorName}].");

            foreach ($flavor->ingredients_json as $item) {
                $this->assertTrue((bool) ($item['is_available'] ?? false));
            }
        }

        $mussarela = PizzaFlavor::where('name', 'Mussarela')->firstOrFail();
        $this->assertSame(['Molho sugo', 'Queijo mussarela', 'Orégano'], collect($mussarela->ingredients_json)->pluck('name')->all());

        $calabresa = PizzaFlavor::where('name', 'Calabresa')->firstOrFail();
        $this->assertContains('Cebola (opcional)', collect($calabresa->ingredients_json)->pluck('name')->all());

        $atum = PizzaFlavor::where('name', 'Atum')->firstOrFail();
        $this->assertContains('Cebola (opcional)', collect($atum->ingredients_json)->pluck('name')->all());

        $salgadas = PizzaFlavor::where('flavor_category', 'salgada')->get();
        $this->assertCount(36, $salgadas);
        foreach ($salgadas as $salgada) {
            $names = collect($salgada->ingredients_json)->pluck('name')->all();
            $this->assertSame('Molho sugo', $names[0] ?? null);
            $this->assertSame('Queijo mussarela', $names[1] ?? null);
        }

        $doces = PizzaFlavor::where('flavor_category', 'doce')->get();
        $this->assertCount(13, $doces);

        // Running seeder twice must remain idempotent
        $this->seed(PizzaFlavorIngredientsSeeder::class);
        $this->assertCount(49, PizzaFlavor::all());
        $this->assertSame(
            ['Molho sugo', 'Queijo mussarela', 'Bacon', 'Orégano'],
            collect(PizzaFlavor::where('name', 'Bacon')->firstOrFail()->ingredients_json)->pluck('name')->all()
        );
    }

    public function test_digital_menu_api_exposes_structured_ingredients_json_and_text(): void
    {
        $this->seed(DatabaseSeeder::class);

        $response = $this->getJson('/api/digital-menu');
        $response->assertOk();

        $flavors = collect($response->json('pizza_flavors'));
        $this->assertCount(49, $flavors);

        $bacon = $flavors->firstWhere('name', 'Bacon');
        $this->assertNotNull($bacon);
        $this->assertSame('Molho sugo, Queijo mussarela, Bacon, Orégano', $bacon['ingredients']);
        $this->assertCount(4, $bacon['ingredients_json']);
        $this->assertSame('Molho sugo', $bacon['ingredients_json'][0]['name']);
        $this->assertSame('Queijo mussarela', $bacon['ingredients_json'][1]['name']);
        $this->assertSame('Bacon', $bacon['ingredients_json'][2]['name']);
    }

    public function test_pos_floor_and_waiter_pages_include_ingredients_json_and_description(): void
    {
        $this->withoutVite();
        $this->seed(DatabaseSeeder::class);

        $admin = $this->createUserWithRole('admin');
        $waiter = $this->createUserWithRole('waiter');

        $this->actingAs($admin)
            ->get('/pos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('POS/Index')
                ->has('pizzaFlavors', 49)
                ->where('pizzaFlavors.0', fn ($flavor) => array_key_exists('ingredients_json', $flavor->toArray())
                    && array_key_exists('description', $flavor->toArray())
                    && ! empty($flavor['ingredients_json'])
                )
            );

        $this->actingAs($admin)
            ->get('/floor')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Floor/Index')
                ->has('pizzaFlavors', 49)
                ->where('pizzaFlavors.0', fn ($flavor) => array_key_exists('ingredients_json', $flavor->toArray())
                    && array_key_exists('description', $flavor->toArray())
                    && ! empty($flavor['ingredients_json'])
                )
            );

        $this->actingAs($waiter)
            ->get('/waiter')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Waiter/Index')
                ->has('pizzaFlavors', 49)
                ->where('pizzaFlavors.0', fn ($flavor) => array_key_exists('ingredients_json', $flavor->toArray())
                    && array_key_exists('description', $flavor->toArray())
                    && ! empty($flavor['ingredients_json'])
                )
            );
    }

    public function test_flavor_controller_store_and_update_sync_ingredients_and_description_from_ingredients_json(): void
    {
        $admin = $this->createUserWithRole('admin');

        $this->actingAs($admin)
            ->post('/flavors', [
                'name' => 'Especial da Casa',
                'base_price' => 89.90,
                'is_active_delivery' => true,
                'is_active_pos' => true,
                'ingredients_json' => [
                    ['name' => 'Molho sugo', 'is_available' => true],
                    ['name' => 'Queijo mussarela', 'is_available' => true],
                    ['name' => 'Parma', 'is_available' => false],
                    ['name' => 'Rúcula', 'is_available' => true],
                ],
            ])
            ->assertRedirect();

        $flavor = PizzaFlavor::where('name', 'Especial da Casa')->firstOrFail();
        $this->assertSame('Molho sugo, Queijo mussarela, Rúcula', $flavor->ingredients);
        $this->assertSame('Molho sugo, Queijo mussarela, Rúcula', $flavor->description);

        $this->actingAs($admin)
            ->put("/flavors/{$flavor->id}", [
                'name' => 'Especial da Casa',
                'base_price' => 92.00,
                'is_active_delivery' => true,
                'is_active_pos' => true,
                'ingredients_json' => [
                    ['name' => 'Molho sugo', 'is_available' => true],
                    ['name' => 'Queijo mussarela', 'is_available' => true],
                    ['name' => 'Parma', 'is_available' => true],
                ],
            ])
            ->assertRedirect();

        $flavor->refresh();
        $this->assertSame('Molho sugo, Queijo mussarela, Parma', $flavor->ingredients);
        $this->assertSame('Molho sugo, Queijo mussarela, Parma', $flavor->description);
    }
}
