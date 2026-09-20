<?php

namespace Tests\Unit\Orders;

use App\Application\Orders\OrderActionException;
use App\Application\Orders\SettleTableModule;
use App\Events\OrderStatusUpdated;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SettleTableModuleTest extends TestCase
{
    use RefreshDatabase;

    private SettleTableModule $module;
    private User $user;
    private CashRegister $cashRegister;

    protected function setUp(): void
    {
        parent::setUp();
        $this->module = app(SettleTableModule::class);
        $this->user = User::factory()->create();

        // Create an open cash register for the store
        $this->cashRegister = CashRegister::create([
            'user_id' => $this->user->id,
            'opened_at' => now(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);
    }

    public function test_settle_table_with_single_order_and_exact_payment_in_cents(): void
    {
        Event::fake([OrderStatusUpdated::class]);

        $table = Table::create(['name' => 'Mesa 10', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00, // 5000 cents
        ]);

        $result = $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 5000],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );

        $this->assertTrue($result->success);
        $this->assertEquals(5000, $result->totalSettledCents);

        // Verify Table released
        $this->assertEquals('available', $table->fresh()->status);

        // Verify Order completed & cash register linked
        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertEquals($this->cashRegister->id, $order->cash_register_id);

        // Verify Payment created
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 5000, // stored in cents in DB
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function ($event) use ($order, $table) {
            return $event->orderId === $order->id
                && $event->status === 'completed'
                && $event->tableId === $table->id;
        });
    }

    public function test_settle_table_with_multiple_orders_waterfall_distribution(): void
    {
        $table = Table::create(['name' => 'Mesa 11', 'status' => 'occupied']);
        
        $order1 = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 30.00, // 3000 cents
        ]);

        $order2 = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_READY,
            'type' => 'salon',
            'total_amount' => 20.00, // 2000 cents
        ]);

        $result = $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'pix', 'amount' => 5000],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );

        $this->assertTrue($result->success);
        $this->assertEquals(5000, $result->totalSettledCents);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order1->id,
            'method' => 'pix',
            'amount' => 3000,
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order2->id,
            'method' => 'pix',
            'amount' => 2000,
        ]);

        $this->assertEquals('completed', $order1->fresh()->status);
        $this->assertEquals('completed', $order2->fresh()->status);
        $this->assertEquals('available', $table->fresh()->status);
    }

    public function test_settle_table_with_split_payments_multiple_methods(): void
    {
        $table = Table::create(['name' => 'Mesa 12', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 60.00, // 6000 cents
        ]);

        $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 2000],
                ['method' => 'credito', 'amount' => 4000],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'dinheiro',
            'amount' => 2000,
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'method' => 'credito',
            'amount' => 4000,
        ]);

        $this->assertEquals('completed', $order->fresh()->status);
    }

    public function test_settle_table_with_service_fee_and_discount(): void
    {
        $table = Table::create(['name' => 'Mesa 13', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00, // 5000 cents
        ]);

        $result = $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'debito', 'amount' => 4500], // 5000 + 500 fee - 1000 discount = 4500
            ],
            settledBy: $this->user,
            options: [
                'amounts_in_cents' => true,
                'service_fee_cents' => 500,
                'discount_cents' => 1000,
                'discount_supervisor_id' => $this->user->id,
            ]
        );

        $this->assertTrue($result->success);

        $order->refresh();
        $this->assertEquals(500, $order->service_fee_amount);
        $this->assertEquals(1000, $order->discount_amount);
        $this->assertEquals($this->user->id, $order->discount_approved_by);
        $this->assertEquals('completed', $order->status);
    }

    public function test_settle_table_throws_when_payment_is_insufficient(): void
    {
        $table = Table::create(['name' => 'Mesa 14', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00, // 5000 cents
        ]);

        $this->expectException(OrderActionException::class);

        $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 4000], // 1000 short
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );
    }

    public function test_settle_table_throws_when_no_active_orders_exist(): void
    {
        $table = Table::create(['name' => 'Mesa 15', 'status' => 'available']);

        $this->expectException(OrderActionException::class);

        $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 5000],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );
    }

    public function test_settle_table_throws_when_no_open_register_exists(): void
    {
        // Close the register
        $this->cashRegister->update(['status' => 'closed']);

        $table = Table::create(['name' => 'Mesa 16', 'status' => 'occupied']);
        Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00,
        ]);

        $this->expectException(OrderActionException::class);

        $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 5000],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => true]
        );
    }

    public function test_settle_table_accepts_float_amounts_when_flag_not_cents(): void
    {
        $table = Table::create(['name' => 'Mesa 17', 'status' => 'occupied']);
        $order = Order::create([
            'table_id' => $table->id,
            'user_id' => $this->user->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 50.00, // 5000 cents
        ]);

        // Passing float 50.00 with amounts_in_cents => false
        $result = $this->module->execute(
            table: $table,
            payments: [
                ['method' => 'dinheiro', 'amount' => 50.00],
            ],
            settledBy: $this->user,
            options: ['amounts_in_cents' => false]
        );

        $this->assertTrue($result->success);
        $this->assertEquals(5000, $result->totalSettledCents);
        $this->assertEquals('completed', $order->fresh()->status);
    }
}
