<?php

namespace Tests\Feature\Security;

use App\Models\CashRegister;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RolePolicyAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_waiter_cannot_close_cash_register_via_web_route(): void
    {
        $waiter = User::factory()->create([
            'role' => 'waiter',
        ]);

        CashRegister::create([
            'user_id' => $waiter->id,
            'opened_at' => now(),
            'opening_balance' => 50,
            'status' => 'open',
        ]);

        $response = $this->actingAs($waiter)->post('/cash-register/close', [
            'closing_balance' => 50,
        ]);

        $response->assertForbidden();
    }

    public function test_waiter_cannot_close_table_without_payment(): void
    {
        $waiter = User::factory()->create([
            'role' => 'waiter',
        ]);

        $table = Table::create([
            'name' => 'Mesa Teste',
            'status' => 'occupied',
        ]);

        Sanctum::actingAs($waiter);

        $response = $this->postJson("/api/tables/{$table->id}/close");

        $response->assertForbidden();
    }

    public function test_waiter_can_access_pay_and_close_flow_endpoint(): void
    {
        $waiter = User::factory()->create([
            'role' => 'waiter',
        ]);

        $table = Table::create([
            'name' => 'Mesa Teste 2',
            'status' => 'occupied',
        ]);

        Sanctum::actingAs($waiter);

        $response = $this->postJson("/api/tables/{$table->id}/pay", []);

        $response->assertStatus(422);
    }
}
