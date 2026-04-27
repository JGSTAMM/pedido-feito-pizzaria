<?php

namespace App\Filament\Pages;

use App\Models\CashRegister;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class Pos extends Component
{
    public const BORDER_OPTIONS = [];

    public array $cart = [];
    public float $total = 0.0;
    public bool $showPizzaModal = false;
    public ?string $selectedPizzaSize = null;
    public array $selectedFlavors = [];
    public float $openingBalance = 0.0;
    public float $closingBalance = 0.0;
    public ?CashRegister $activeRegister = null;
    public array $cashSummary = [
        'opening_balance' => 0.0,
        'total_sales' => 0.0,
        'order_count' => 0,
        'total_change' => 0.0,
        'net_cash' => 0.0,
        'total_in_drawer' => 0.0,
    ];

    public static function getUrl(): string
    {
        return '/pos';
    }

    public function mount(): void
    {
        $this->activeRegister = CashRegister::query()
            ->where('user_id', Auth::id())
            ->where('status', 'open')
            ->latest()
            ->first();

        $this->refreshCashSummary();
    }

    public function openRegister(): mixed
    {
        $this->activeRegister = CashRegister::create([
            'user_id' => Auth::id(),
            'opening_balance' => $this->openingBalance,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        $this->refreshCashSummary();

        return redirect()->to(self::getUrl());
    }

    public function closeRegister(): void
    {
        if (!$this->activeRegister) {
            return;
        }

        $calculated = (float) ($this->cashSummary['total_in_drawer'] ?? 0.0);

        $this->activeRegister->update([
            'closed_at' => now(),
            'closing_balance' => $this->closingBalance,
            'calculated_balance' => $calculated,
            'difference' => $this->closingBalance - $calculated,
            'status' => 'closed',
        ]);

        $this->activeRegister = null;
        $this->refreshCashSummary();
    }

    public function addProductToCart(string $productId): void
    {
        $product = Product::findOrFail($productId);
        $key = 'product_' . $product->id;

        if (!isset($this->cart[$key])) {
            $this->cart[$key] = [
                'name' => $product->name,
                'quantity' => 0,
                'unit_price' => (float) $product->price,
                'subtotal' => 0.0,
            ];
        }

        $this->cart[$key]['quantity']++;
        $this->cart[$key]['subtotal'] = $this->cart[$key]['quantity'] * $this->cart[$key]['unit_price'];

        $this->recalculateTotal();
    }

    public function openPizzaBuilder(string $flavorId): void
    {
        $this->showPizzaModal = true;
        $this->selectedFlavors = [$flavorId];
    }

    public function selectPizzaSize(string $sizeId): void
    {
        $this->selectedPizzaSize = $sizeId;
    }

    public function addPizzaToCart(): void
    {
        if (empty($this->selectedFlavors)) {
            return;
        }

        if ($this->selectedPizzaSize) {
            PizzaSize::findOrFail($this->selectedPizzaSize);
        }

        $price = ((float) PizzaFlavor::query()
            ->whereIn('id', $this->selectedFlavors)
            ->max('base_price')) / 100;

        $this->cart[] = [
            'name' => 'Pizza',
            'quantity' => 1,
            'unit_price' => $price,
            'subtotal' => $price,
        ];

        $this->showPizzaModal = false;
        $this->selectedPizzaSize = null;
        $this->selectedFlavors = [];

        $this->recalculateTotal();
    }

    public function checkout(): void
    {
        if (empty($this->cart)) {
            return;
        }

        Order::create([
            'user_id' => Auth::id(),
            'cash_register_id' => $this->activeRegister?->id,
            'status' => 'paid',
            'type' => 'salon',
            'customer_name' => 'Cliente',
            'total_amount' => $this->total,
            'paid_at' => now(),
            'change_amount' => 0,
        ]);

        Notification::make()
            ->success()
            ->title('Venda realizada com sucesso!')
            ->send();

        $this->cart = [];
        $this->total = 0.0;
        $this->refreshCashSummary();
    }

    public function render(): mixed
    {
        return view('livewire.filament.pos-test-page');
    }

    private function recalculateTotal(): void
    {
        $this->total = (float) collect($this->cart)->sum(fn (array $item) => $item['subtotal'] ?? 0);
    }

    private function refreshCashSummary(): void
    {
        if (!$this->activeRegister) {
            $this->cashSummary = [
                'opening_balance' => 0.0,
                'total_sales' => 0.0,
                'order_count' => 0,
                'total_change' => 0.0,
                'net_cash' => 0.0,
                'total_in_drawer' => 0.0,
            ];

            return;
        }

        $orders = Order::query()
            ->where('cash_register_id', $this->activeRegister->id)
            ->where('status', 'paid')
            ->get();

        $cashPayments = ((float) Payment::query()
            ->whereIn('order_id', $orders->pluck('id'))
            ->where('method', 'dinheiro')
            ->sum('amount')) / 100;

        $totalChange = (float) $orders->sum('change_amount');
        $netCash = (float) $cashPayments - $totalChange;

        $this->cashSummary = [
            'opening_balance' => (float) $this->activeRegister->opening_balance,
            'total_sales' => (float) $orders->sum('total_amount'),
            'order_count' => $orders->count(),
            'total_change' => $totalChange,
            'net_cash' => $netCash,
            'total_in_drawer' => (float) $this->activeRegister->opening_balance + $netCash,
        ];
    }
}
