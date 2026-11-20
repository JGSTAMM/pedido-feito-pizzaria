<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SupervisorPinSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_supervisor_security_settings_without_exposing_pin_hash(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Principal',
            'role' => 'admin',
            'pin_hash' => Hash::make('1234'),
        ]);

        $response = $this->actingAs($admin)->get('/settings');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Index')
            ->where('supervisorSecurity.can_manage', true)
            ->where('supervisorSecurity.current_user_id', $admin->id)
            ->has('supervisorSecurity.supervisors', 1)
            ->where('supervisorSecurity.supervisors.0.id', $admin->id)
            ->where('supervisorSecurity.supervisors.0.has_pin', true)
            ->missing('supervisorSecurity.supervisors.0.pin_hash')
        );
    }

    public function test_cashier_cannot_manage_or_modify_supervisor_pin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $cashier = User::factory()->create(['role' => 'caixa']);

        $indexResponse = $this->actingAs($cashier)->get('/settings');
        $indexResponse->assertOk();
        $indexResponse->assertInertia(fn (Assert $page) => $page
            ->where('supervisorSecurity.can_manage', false)
            ->where('supervisorSecurity.supervisors', [])
        );

        $updateResponse = $this->actingAs($cashier)->post('/settings/supervisor-pin', [
            'user_id' => $admin->id,
            'pin' => '4321',
            'pin_confirmation' => '4321',
        ]);
        $updateResponse->assertForbidden();

        $deleteResponse = $this->actingAs($cashier)->delete("/settings/supervisor-pin/{$admin->id}");
        $deleteResponse->assertForbidden();
    }

    public function test_waiter_cannot_modify_supervisor_pin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $waiter = User::factory()->create(['role' => 'waiter']);

        $response = $this->actingAs($waiter)->post('/settings/supervisor-pin', [
            'user_id' => $admin->id,
            'pin' => '4321',
            'pin_confirmation' => '4321',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_configure_four_digit_pin_preserving_leading_zeros_and_validate_it(): void
    {
        $admin = User::factory()->create([
            'name' => 'Gerente Teste',
            'role' => 'admin',
            'pin_hash' => null,
        ]);

        $updateResponse = $this->actingAs($admin)->post('/settings/supervisor-pin', [
            'user_id' => $admin->id,
            'pin' => '0429',
            'pin_confirmation' => '0429',
        ]);

        $updateResponse->assertRedirect();
        $updateResponse->assertSessionHas('success');

        $admin->refresh();
        $this->assertNotNull($admin->pin_hash);
        $this->assertNotEquals('0429', $admin->pin_hash);
        $this->assertTrue(Hash::check('0429', $admin->pin_hash));

        $validateResponse = $this->actingAs($admin)->postJson('/floor/validate-supervisor-pin', [
            'pin' => '0429',
        ]);

        $validateResponse->assertOk()
            ->assertJson([
                'valid' => true,
                'supervisor_name' => 'Gerente Teste',
                'supervisor_id' => $admin->id,
            ]);
    }

    public function test_supervisor_pin_update_validates_format_confirmation_and_uniqueness(): void
    {
        $adminA = User::factory()->create([
            'role' => 'admin',
            'pin_hash' => Hash::make('1234'),
        ]);
        $adminB = User::factory()->create([
            'role' => 'supervisor',
            'pin_hash' => null,
        ]);
        $waiter = User::factory()->create(['role' => 'waiter']);

        // Invalid length / characters
        $this->actingAs($adminA)->post('/settings/supervisor-pin', [
            'user_id' => $adminB->id,
            'pin' => '12a4',
            'pin_confirmation' => '12a4',
        ])->assertSessionHasErrors('pin');

        // Mismatched confirmation
        $this->actingAs($adminA)->post('/settings/supervisor-pin', [
            'user_id' => $adminB->id,
            'pin' => '5678',
            'pin_confirmation' => '5679',
        ])->assertSessionHasErrors('pin');

        // Duplicate PIN with another supervisor
        $this->actingAs($adminA)->post('/settings/supervisor-pin', [
            'user_id' => $adminB->id,
            'pin' => '1234',
            'pin_confirmation' => '1234',
        ])->assertSessionHasErrors('pin');

        // Non-supervisor target user rejected
        $this->actingAs($adminA)->post('/settings/supervisor-pin', [
            'user_id' => $waiter->id,
            'pin' => '5678',
            'pin_confirmation' => '5678',
        ])->assertSessionHasErrors('user_id');
    }

    public function test_floor_pin_validation_reports_not_configured_and_admin_can_clear_pin(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'pin_hash' => null,
        ]);

        // Initially no supervisor has a PIN
        $this->actingAs($admin)
            ->postJson('/floor/validate-supervisor-pin', ['pin' => '1234'])
            ->assertStatus(401)
            ->assertJson([
                'valid' => false,
                'reason' => 'not_configured',
            ]);

        // Set PIN and verify invalid PIN reason differs
        $admin->pin_hash = Hash::make('2580');
        $admin->save();

        $this->actingAs($admin)
            ->postJson('/floor/validate-supervisor-pin', ['pin' => '9999'])
            ->assertStatus(401)
            ->assertJson([
                'valid' => false,
                'reason' => 'invalid_pin',
            ]);

        // Clear PIN and ensure it returns to not_configured
        $deleteResponse = $this->actingAs($admin)
            ->delete("/settings/supervisor-pin/{$admin->id}");

        $deleteResponse->assertRedirect();
        $this->assertNull($admin->fresh()->pin_hash);

        $this->actingAs($admin)
            ->postJson('/floor/validate-supervisor-pin', ['pin' => '2580'])
            ->assertStatus(401)
            ->assertJson([
                'valid' => false,
                'reason' => 'not_configured',
            ]);
    }
}
