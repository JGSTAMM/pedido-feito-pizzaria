<?php

namespace Tests\Feature;

use App\Models\Neighborhood;
use App\Models\User;
use Database\Seeders\NeighborhoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NeighborhoodManagementTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithRole(string $role, ?string $pin = null): User
    {
        return User::factory()->create([
            'role' => $role,
            'pin_hash' => $pin !== null ? Hash::make($pin) : null,
        ]);
    }

    public function test_settings_includes_neighborhoods_and_admin_can_edit_directly(): void
    {
        $this->withoutVite();
        $admin = $this->createUserWithRole('admin', '1234');
        Neighborhood::create([
            'name' => 'Centro',
            'city' => 'Torres',
            'delivery_fee' => 12.00,
        ]);

        $response = $this->actingAs($admin)->get('/settings');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Index')
                ->has('neighborhoods', 1)
                ->where('deliveryFeeSecurity.can_edit_directly', true)
                ->where('deliveryFeeSecurity.is_unlocked', true)
            );
    }

    public function test_admin_can_crud_and_bulk_update_neighborhoods_without_pin(): void
    {
        $admin = $this->createUserWithRole('admin', '1234');

        $this->actingAs($admin)
            ->post('/neighborhoods', [
                'city' => 'Torres',
                'name' => 'Praia da Cal',
                'delivery_fee' => 16.50,
                'observation' => 'beira',
            ])
            ->assertRedirect();

        $neighborhood = Neighborhood::where('name', 'Praia da Cal')->firstOrFail();
        $this->assertEquals(16.50, (float) $neighborhood->delivery_fee);

        $this->actingAs($admin)
            ->post('/neighborhoods/bulk-update', [
                'items' => [
                    ['id' => $neighborhood->id, 'delivery_fee' => 19.00],
                ],
            ])
            ->assertRedirect();

        $this->assertEquals(19.00, (float) $neighborhood->fresh()->delivery_fee);

        $this->actingAs($admin)
            ->put("/neighborhoods/{$neighborhood->id}", [
                'city' => 'Torres',
                'name' => 'Praia da Cal',
                'delivery_fee' => 21.00,
                'observation' => 'atualizado',
            ])
            ->assertRedirect();

        $this->assertEquals(21.00, (float) $neighborhood->fresh()->delivery_fee);
        $this->assertEquals('atualizado', $neighborhood->fresh()->observation);

        $this->actingAs($admin)
            ->delete("/neighborhoods/{$neighborhood->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('neighborhoods', ['id' => $neighborhood->id]);
    }

    public function test_cashier_and_waiter_are_blocked_without_admin_pin(): void
    {
        $this->createUserWithRole('admin', '4321');
        $cashier = $this->createUserWithRole('cashier');
        $waiter = $this->createUserWithRole('waiter');

        $neighborhood = Neighborhood::create([
            'city' => 'Torres',
            'name' => 'Centro',
            'delivery_fee' => 12.00,
        ]);

        foreach ([$cashier, $waiter] as $staff) {
            $this->actingAs($staff)
                ->post('/neighborhoods', [
                    'city' => 'Torres',
                    'name' => 'Novo',
                    'delivery_fee' => 10,
                ])
                ->assertForbidden();

            $this->actingAs($staff)
                ->post('/neighborhoods/bulk-update', [
                    'items' => [['id' => $neighborhood->id, 'delivery_fee' => 25]],
                ])
                ->assertForbidden();

            $this->actingAs($staff)
                ->put("/neighborhoods/{$neighborhood->id}", [
                    'city' => 'Torres',
                    'name' => 'Centro',
                    'delivery_fee' => 25,
                ])
                ->assertForbidden();

            $this->actingAs($staff)
                ->delete("/neighborhoods/{$neighborhood->id}")
                ->assertForbidden();
        }

        $this->assertEquals(12.00, (float) $neighborhood->fresh()->delivery_fee);
    }

    public function test_supervisor_pin_does_not_unlock_admin_delivery_fees_and_admin_pin_unlocks_and_relocks(): void
    {
        $this->createUserWithRole('admin', '9876');
        $this->createUserWithRole('supervisor', '5555');
        $cashier = $this->createUserWithRole('cashier');

        $neighborhood = Neighborhood::create([
            'city' => 'Passo de Torres',
            'name' => 'Silveira',
            'delivery_fee' => 15.00,
        ]);

        // Supervisor PIN must be rejected (Admin PIN required)
        $this->actingAs($cashier)
            ->postJson('/neighborhoods/validate-admin-pin', ['pin' => '5555'])
            ->assertUnauthorized();

        // Admin PIN unlocks session
        $this->actingAs($cashier)
            ->postJson('/neighborhoods/validate-admin-pin', ['pin' => '9876'])
            ->assertOk()
            ->assertJson(['valid' => true]);

        $this->actingAs($cashier)
            ->post('/neighborhoods/bulk-update', [
                'items' => [['id' => $neighborhood->id, 'delivery_fee' => 18.00]],
            ])
            ->assertRedirect();

        $this->assertEquals(18.00, (float) $neighborhood->fresh()->delivery_fee);

        // Lock again and confirm blocked
        $this->actingAs($cashier)
            ->post('/neighborhoods/lock-admin-pin')
            ->assertRedirect();

        $this->actingAs($cashier)
            ->post('/neighborhoods/bulk-update', [
                'items' => [['id' => $neighborhood->id, 'delivery_fee' => 99.00]],
            ])
            ->assertForbidden();

        $this->assertEquals(18.00, (float) $neighborhood->fresh()->delivery_fee);
    }

    public function test_neighborhood_seeder_syncs_updated_torres_and_passo_de_torres_fees_idempotently(): void
    {
        Neighborhood::create([
            'city' => 'Torres',
            'name' => 'Centenário',
            'delivery_fee' => 15.00,
        ]);

        $this->seed(NeighborhoodSeeder::class);
        $this->seed(NeighborhoodSeeder::class);

        $this->assertDatabaseCount('neighborhoods', 48);
        $this->assertEquals(18.00, (float) Neighborhood::where('city', 'Torres')->where('name', 'Centenário')->firstOrFail()->delivery_fee);
        $this->assertEquals(18.00, (float) Neighborhood::where('city', 'Passo de Torres')->where('name', 'Silveira')->firstOrFail()->delivery_fee);
        $this->assertEquals(25.00, (float) Neighborhood::where('city', 'Passo de Torres')->where('name', 'Novo passo')->firstOrFail()->delivery_fee);
        $this->assertEquals(20.00, (float) Neighborhood::where('city', 'Passo de Torres')->where('name', 'Alto feliz')->firstOrFail()->delivery_fee);
        $this->assertEquals(25.00, (float) Neighborhood::where('city', 'Passo de Torres')->where('name', 'Barra Velha')->firstOrFail()->delivery_fee);
    }
}
