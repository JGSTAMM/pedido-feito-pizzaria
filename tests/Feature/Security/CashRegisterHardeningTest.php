<?php

namespace Tests\Feature\Security;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashRegisterHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_waiter_settling_table_links_to_active_store_cash_register(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $waiter = User::factory()->create(['role' => 'waiter']);

        // Cash register is opened by admin/cashier
        $register = CashRegister::create([
            'user_id' => $admin->id,
            'opened_at' => now(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        $table = Table::create(['name' => 'Mesa 1', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00,
        ]);

        Sanctum::actingAs($waiter);

        $response = $this->postJson("/api/tables/{$table->id}/pay", [
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 50.00],
            ],
        ]);

        $response->assertStatus(200);

        $order->refresh();
        // Crucial security assertion: cash_register_id must NOT be null even when waiter settles
        $this->assertNotNull($order->cash_register_id, 'Orphan payment detected: cash_register_id cannot be null');
        $this->assertEquals($register->id, $order->cash_register_id);
    }

    public function test_settle_table_fails_when_store_cash_register_is_closed(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);

        $table = Table::create(['name' => 'Mesa 2', 'status' => 'occupied']);
        Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00,
        ]);

        Sanctum::actingAs($waiter);

        // No cash register is open
        $response = $this->postJson("/api/tables/{$table->id}/pay", [
            'payments' => [
                ['method' => 'dinheiro', 'amount' => 50.00],
            ],
        ]);

        // Must reject payment with 403 (forbidden) or 400/422 when register is closed
        $this->assertTrue(in_array($response->status(), [400, 403, 422]));
    }
}
