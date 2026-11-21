<?php

namespace Tests\Unit;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashRegisterLockServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_require_open_register_returns_latest_open_register(): void
    {
        $user = User::factory()->create();

        $closed = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHours(5),
            'closed_at' => now()->subHours(3),
            'opening_balance' => 100,
            'closing_balance' => 150,
            'status' => 'closed',
        ]);

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 200,
            'status' => 'open',
        ]);

        $service = app(CashRegisterLockService::class);
        $register = $service->requireOpenRegister();

        $this->assertEquals($open->id, $register->id);
        $this->assertNotEquals($closed->id, $register->id);
    }

    public function test_assert_can_close_register_throws_when_pending_orders_exist(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 200,
            'status' => 'open',
        ]);

        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_PENDING,
            'type' => 'salon',
            'total_amount' => 120,
        ]);

        $service = app(CashRegisterLockService::class);

        $this->expectException(OrderActionException::class);
        $service->assertCanCloseRegister($open);
    }

    public function test_assert_can_close_register_allows_when_all_orders_are_settled(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 200,
            'status' => 'open',
        ]);

        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_COMPLETED,
            'type' => 'salon',
            'total_amount' => 80,
            'paid_at' => now()->subMinutes(10),
        ]);

        $service = app(CashRegisterLockService::class);
        $service->assertCanCloseRegister($open);

        $this->assertTrue(true);
    }

    public function test_assert_can_close_register_allows_when_pickup_and_delivery_orders_are_delivered_and_paid(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 183.40,
            'status' => 'open',
        ]);

        // Simulating the 6 delivered orders from balcão/retirada
        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'total_amount' => 170.00,
            'paid_at' => now()->subMinutes(20),
        ]);

        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_DELIVERED,
            'type' => 'delivery',
            'total_amount' => 50.00,
            'paid_at' => now()->subMinutes(15),
        ]);

        $service = app(CashRegisterLockService::class);
        $service->assertCanCloseRegister($open);

        $this->assertTrue(true);
    }

    public function test_assert_can_close_register_blocks_when_delivered_order_is_not_paid(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_DELIVERED,
            'type' => 'pickup',
            'total_amount' => 45.00,
            'paid_at' => null,
        ]);

        $service = app(CashRegisterLockService::class);

        $this->expectException(OrderActionException::class);
        $service->assertCanCloseRegister($open);
    }

    public function test_assert_can_close_register_ignores_cancelled_rejected_and_abandoned_online_orders(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        // Cancelled order (paid_at is null)
        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_CANCELLED,
            'type' => 'salon',
            'total_amount' => 60.00,
            'paid_at' => null,
        ]);

        // Rejected order (paid_at is null)
        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_REJECTED,
            'type' => 'delivery',
            'total_amount' => 90.00,
            'paid_at' => null,
        ]);

        // Abandoned online cart (awaiting_payment, paid_at is null)
        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_AWAITING_PAYMENT,
            'type' => 'delivery',
            'total_amount' => 120.00,
            'paid_at' => null,
        ]);

        $service = app(CashRegisterLockService::class);
        $service->assertCanCloseRegister($open);

        $this->assertTrue(true);
    }

    public function test_assert_can_close_register_blocks_when_order_is_paid_but_still_in_kitchen(): void
    {
        $user = User::factory()->create();

        $open = CashRegister::create([
            'user_id' => $user->id,
            'opened_at' => now()->subHour(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        // Order is paid via PIX online, but kitchen is still preparing it
        Order::create([
            'user_id' => $user->id,
            'cash_register_id' => $open->id,
            'status' => Order::STATUS_PREPARING,
            'type' => 'delivery',
            'total_amount' => 85.00,
            'paid_at' => now()->subMinutes(5),
        ]);

        $service = app(CashRegisterLockService::class);

        $this->expectException(OrderActionException::class);
        $service->assertCanCloseRegister($open);
    }
}
