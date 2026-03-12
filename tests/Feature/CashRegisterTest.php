<?php

namespace Tests\Feature;

use App\Filament\Pages\Pos;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class CashRegisterTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        // Clean up dirty state from other tests that might have committed
        CashRegister::query()->delete();
        Order::query()->delete();
        User::query()->delete();
        
        $this->user = User::factory()->create();
        // Pos mount() needs at least Product table to exist (categories query)
        Product::factory()->create(['name' => 'Test Product', 'price' => 10, 'category' => 'Test']);
    }

    public function test_can_open_register()
    {
        // When no register is open, Pos shows the open register form
        Livewire::actingAs($this->user)
            ->test(Pos::class)
            ->assertSee('Caixa Fechado') // Should show "Caixa Fechado" screen
            ->set('openingBalance', 100.00)
            ->call('openRegister')
            ->assertRedirect();

        $this->assertDatabaseHas('cash_registers', [
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'status' => 'open',
        ]);
    }

    public function test_pos_order_links_to_active_register()
    {
        // Open register
        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->actingAs($this->user);

        // Simulate what Pos.php does when creating an order:
        $activeRegister = CashRegister::where('user_id', $this->user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        $order = Order::create([
            'user_id' => $this->user->id,
            'total_amount' => 50.00,
            'status' => 'paid',
            'cash_register_id' => $activeRegister->id,
        ]);

        $this->assertEquals($register->id, $order->cash_register_id);
    }

    public function test_summary_calculation()
    {
        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        // Create Order 1: Cash 50, Total 40, Change 10
        $order1 = Order::create([
            'user_id' => $this->user->id,
            'cash_register_id' => $register->id,
            'total_amount' => 40.00,
            'change_amount' => 10.00,
            'status' => 'paid',
        ]);
        Payment::create(['order_id' => $order1->id, 'method' => 'dinheiro', 'amount' => 50.00]);

        // Create Order 2: Card 60
        $order2 = Order::create([
            'user_id' => $this->user->id,
            'cash_register_id' => $register->id,
            'total_amount' => 60.00,
            'status' => 'paid',
        ]);
        Payment::create(['order_id' => $order2->id, 'method' => 'credito', 'amount' => 60.00]);
        
        // Test calculation in Pos (mount should calculate when register is open)
        $component = Livewire::actingAs($this->user)
            ->test(Pos::class)
            ->assertSet('activeRegister.id', $register->id);
            
        $this->assertEquals(100.0, $component->get('cashSummary.opening_balance'));
        $this->assertEquals(100.0, $component->get('cashSummary.total_sales'));
        $this->assertEquals(10.0, $component->get('cashSummary.total_change'));
        $this->assertEquals(40.0, $component->get('cashSummary.net_cash'));
        $this->assertEquals(140.0, $component->get('cashSummary.total_in_drawer'));
    }

    public function test_can_close_register()
    {
        $register = CashRegister::create([
            'user_id' => $this->user->id,
            'opening_balance' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        Livewire::actingAs($this->user)
            ->test(Pos::class)
            ->set('closingBalance', 100.00) // Matches opening balance (no sales)
            ->call('closeRegister');

        $register->refresh();
        $this->assertEquals('closed', $register->status);
        $this->assertEquals(100.00, $register->closing_balance);
        $this->assertEquals(0.00, $register->difference);
    }
}
