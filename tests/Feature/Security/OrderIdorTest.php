<?php

namespace Tests\Feature\Security;

use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderIdorTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_orders_from_tables_in_another_context()
    {
        // This test will currently FAIL if the vulnerability exists
        $user1 = User::factory()->create(['role' => 'admin']);
        $user2 = User::factory()->create(['role' => 'customer']);

        $table1 = Table::create(['name' => 'Mesa 1', 'status' => 'available']);
        $table2 = Table::create(['name' => 'Mesa 2', 'status' => 'available']);

        $order1 = new Order();
        $order1->forceFill([
            'table_id' => $table1->id,
            'status' => 'preparing',
            'customer_name' => 'Secret Customer',
            'total_amount' => 100.00,
        ])->save();

        // User 2 should NOT be able to see Table 1's orders
        // Note: Currently we don't have store-table relationships, 
        // but a basic check would be ensuring the user is a waiter/admin
        // or has a relationship to the table.
        
        // User 2 (no role) should be FORBIDDEN from viewing table orders
        $response = $this->actingAs($user2)->getJson("/api/tables/{$table1->id}/orders");
        $response->assertStatus(403);

        // Waiter SHOULD be able to see it
        $waiter = User::factory()->create(['role' => 'waiter']);
        $response = $this->actingAs($waiter)->getJson("/api/tables/{$table1->id}/orders");
        $response->assertStatus(200);
    }
}
