<?php

namespace Tests\Feature;

use App\Application\Orders\CreateOrderAction;
use App\Application\Orders\OrderActionException;
use App\Jobs\PrintKitchenTicketJob;
use App\Models\CashRegister;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class CreateOrderAfterCommitPrintingTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_dispatches_print_job_after_order_commit(): void
    {
        Bus::fake();

        config()->set('printing.auto_print_kitchen', true);
        config()->set('printing.auto_print_receipt', false);

        $user = User::factory()->create();
        $table = Table::query()->create([
            'name' => 'A1',
            'status' => 'available',
        ]);

        $product = Product::factory()->create([
            'price' => 19.90,
        ]);

        $register = CashRegister::query()->create([
            'user_id' => $user->id,
            'opened_at' => now(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        $action = app(CreateOrderAction::class);

        $order = $action->execute([
            'table_id' => $table->id,
            'items' => [
                [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ], $user);

        Bus::assertDispatched(PrintKitchenTicketJob::class, function (PrintKitchenTicketJob $job) use ($order) {
            return $job->orderId === $order->id;
        });

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'cash_register_id' => $register->id,
        ]);

        $this->assertDatabaseHas('tables', [
            'id' => $table->id,
            'status' => 'occupied',
        ]);
    }

    public function test_it_does_not_dispatch_print_job_when_transaction_rolls_back(): void
    {
        Bus::fake();

        config()->set('printing.auto_print_kitchen', true);
        config()->set('printing.auto_print_receipt', false);

        $user = User::factory()->create();
        $table = Table::query()->create([
            'name' => 'A2',
            'status' => 'available',
        ]);

        CashRegister::query()->create([
            'user_id' => $user->id,
            'opened_at' => now(),
            'opening_balance' => 100,
            'status' => 'open',
        ]);

        $action = app(CreateOrderAction::class);

        $this->expectException(OrderActionException::class);

        try {
            $action->execute([
                'table_id' => $table->id,
                'items' => [
                    [
                        'type' => 'product',
                        // Invalid product id forces rollback.
                        'product_id' => '00000000-0000-0000-0000-000000000000',
                        'quantity' => 1,
                    ],
                ],
            ], $user);
        } finally {
            Bus::assertNotDispatched(PrintKitchenTicketJob::class);
        }
    }
}
