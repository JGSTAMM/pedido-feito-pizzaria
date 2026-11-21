<?php

namespace Tests\Feature;

use App\Application\CashRegister\BuildCashRegisterSummaryAction;
use App\Application\CashRegister\EnsureNoPendingOrdersForCloseAction;
use App\Application\Orders\BuildKdsOrdersAction;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderDeletionWithPinTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        StoreSetting::create([
            'store_name' => 'Sr. & Sra. Lucchese Pizzaria',
            'is_open' => true,
        ]);
    }

    public function test_deleting_order_requires_valid_pin_even_for_admin(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin Principal',
            'role' => 'admin',
            'pin_hash' => Hash::make('4321'),
        ]);

        $order = Order::create([
            'user_id' => $admin->id,
            'type' => 'pickup',
            'status' => 'pending',
            'customer_name' => 'Cliente Teste',
            'total_amount' => 55.00,
        ]);

        // Missing PIN fails with 422
        $this->actingAs($admin)
            ->postJson("/orders/{$order->id}/delete-with-pin", [])
            ->assertStatus(422);

        // Wrong PIN fails with 401 even as admin
        $this->actingAs($admin)
            ->postJson("/orders/{$order->id}/delete-with-pin", ['pin' => '9999'])
            ->assertStatus(401)
            ->assertJson([
                'success' => false,
                'valid' => false,
                'reason' => 'invalid_pin',
            ]);

        $this->assertNotSoftDeleted('orders', ['id' => $order->id]);
    }

    public function test_deleting_order_with_valid_pin_soft_deletes_and_cleans_cash_kds_print_and_table(): void
    {
        $supervisor = User::factory()->create([
            'name' => 'Gerente Turno',
            'role' => 'supervisor',
            'pin_hash' => Hash::make('2580'),
        ]);
        $waiter = User::factory()->create(['role' => 'waiter']);

        $register = CashRegister::create([
            'user_id' => $supervisor->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $table = Table::create(['name' => 'Mesa 10', 'status' => 'occupied']);
        $product = Product::factory()->create(['name' => 'Refrigerante 2L', 'price' => 15.00]);

        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'cash_register_id' => $register->id,
            'type' => 'dine_in',
            'status' => 'preparing',
            'customer_name' => 'Mesa 10',
            'total_amount' => 30.00,
            'paid_at' => now(),
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 15.00,
            'subtotal' => 30.00,
            'type' => 'product',
            'description' => 'Refrigerante 2L',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 30.00,
            'paid_at' => now(),
        ]);

        PrintJob::create([
            'order_id' => $order->id,
            'table_id' => $table->id,
            'type' => 'kitchen_ticket',
            'target' => 'kitchen',
            'status' => 'pending',
            'payload' => ['test' => true],
        ]);

        $response = $this->actingAs($waiter)
            ->postJson("/orders/{$order->id}/delete-with-pin", [
                'pin' => '2580',
                'reason' => 'Lançamento duplicado',
            ]);

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertSoftDeleted('orders', ['id' => $order->id]);
        $this->assertSoftDeleted('order_items', ['id' => $item->id]);
        $this->assertSoftDeleted('payments', ['id' => $payment->id]);
        $this->assertDatabaseMissing('print_jobs', ['order_id' => $order->id, 'status' => 'pending']);

        $deletedOrder = Order::withTrashed()->findOrFail($order->id);
        $this->assertEquals('cancelled', $deletedOrder->status);
        $this->assertNull($deletedOrder->paid_at);
        $this->assertStringContainsString('Gerente Turno', (string) $deletedOrder->rejection_reason);

        $this->assertEquals('available', $table->fresh()->status);

        $summary = app(BuildCashRegisterSummaryAction::class)->execute($register);
        $this->assertEquals(0.0, $summary['total_sales']);
        $this->assertEquals(0, $summary['order_count']);

        $pendingCount = app(EnsureNoPendingOrdersForCloseAction::class)->execute($register);
        $this->assertEquals(0, $pendingCount);

        $kdsOrders = app(BuildKdsOrdersAction::class)->execute();
        $this->assertTrue($kdsOrders->where('id', $order->id)->isEmpty());
    }

    public function test_deleting_single_item_recalculates_order_total_and_last_item_frees_table(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin',
            'role' => 'admin',
            'pin_hash' => Hash::make('1234'),
        ]);

        $table = Table::create(['name' => 'Mesa 3', 'status' => 'occupied']);
        $p1 = Product::factory()->create(['name' => 'Item A', 'price' => 25.00]);
        $p2 = Product::factory()->create(['name' => 'Item B', 'price' => 40.00]);

        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $admin->id,
            'type' => 'dine_in',
            'status' => 'pending',
            'customer_name' => 'Mesa 3',
            'total_amount' => 65.00,
        ]);

        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $p1->id,
            'quantity' => 1,
            'unit_price' => 25.00,
            'subtotal' => 25.00,
            'type' => 'product',
            'description' => 'Item A',
        ]);

        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $p2->id,
            'quantity' => 1,
            'unit_price' => 40.00,
            'subtotal' => 40.00,
            'type' => 'product',
            'description' => 'Item B',
        ]);

        // Delete first item -> order remains with R$ 40,00
        $res1 = $this->actingAs($admin)
            ->postJson("/orders/{$order->id}/items/{$item1->id}/delete-with-pin", ['pin' => '1234']);

        $res1->assertOk()->assertJson([
            'success' => true,
            'order_deleted' => false,
            'new_total' => 40.0,
        ]);

        $this->assertSoftDeleted('order_items', ['id' => $item1->id]);
        $this->assertEquals(40.0, (float) $order->fresh()->total_amount);
        $this->assertEquals('occupied', $table->fresh()->status);

        // Delete remaining item -> entire order cancelled & table freed
        $res2 = $this->actingAs($admin)
            ->postJson("/orders/{$order->id}/items/{$item2->id}/delete-with-pin", ['pin' => '1234']);

        $res2->assertOk()->assertJson([
            'success' => true,
            'order_deleted' => true,
            'new_total' => 0.0,
        ]);

        $this->assertSoftDeleted('orders', ['id' => $order->id]);
        $this->assertEquals('available', $table->fresh()->status);
    }

    public function test_clearing_table_comanda_requires_pin_and_removes_all_active_orders(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin',
            'role' => 'admin',
            'pin_hash' => Hash::make('0077'),
        ]);
        $waiter = User::factory()->create(['role' => 'waiter']);

        $table = Table::create(['name' => 'Mesa VIP', 'status' => 'occupied']);

        $order1 = Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'type' => 'dine_in',
            'status' => 'preparing',
            'customer_name' => 'Mesa VIP',
            'total_amount' => 50.00,
        ]);

        $order2 = Order::create([
            'table_id' => $table->id,
            'user_id' => $waiter->id,
            'type' => 'dine_in',
            'status' => 'ready',
            'customer_name' => 'Mesa VIP',
            'total_amount' => 30.00,
        ]);

        $this->actingAs($waiter)
            ->postJson("/floor/{$table->id}/clear-comanda", ['pin' => '1111'])
            ->assertStatus(401);

        $this->actingAs($waiter)
            ->postJson("/floor/{$table->id}/clear-comanda", ['pin' => '0077'])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'deleted_count' => 2,
            ]);

        $this->assertSoftDeleted('orders', ['id' => $order1->id]);
        $this->assertSoftDeleted('orders', ['id' => $order2->id]);
        $this->assertEquals('available', $table->fresh()->status);
    }
}
