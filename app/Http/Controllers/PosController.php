<?php

namespace App\Http\Controllers;

use App\Application\Orders\CreateCounterOrderAction;
use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PosController extends Controller
{
    public function __construct(
        private readonly CreateCounterOrderAction $createCounterOrderAction,
    ) {}

    /**
     * Display the POS page with all catalog data.
     *
     * @return \Inertia\Response
     */
    public function index(): \Inertia\Response
    {
        return Inertia::render('POS/Index', [
            'products' => $this->getProducts(),
            'pizzaFlavors' => $this->getPizzaFlavors(),
            'pizzaSizes' => $this->getPizzaSizes(),
            'categories' => $this->getCategories(),
            'borderOptions' => $this->getBorderOptions(),
            'cashRegister' => $this->getCashRegisterData(),
        ]);
    }

    private function getProducts(): array
    {
        return Product::where('is_active_pos', true)
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'category' => $p->category,
                'image_url' => $p->image_url,
                'variations' => $p->variations,
                'type' => 'product',
            ])->toArray();
    }

    private function getPizzaFlavors(): array
    {
        return PizzaFlavor::where('is_active_pos', true)
            ->orderBy('name')
            ->get()
            ->map(fn (PizzaFlavor $flavor) => $flavor->toStaffBuilderArray())
            ->toArray();
    }

    private function getCategories(): array
    {
        $categories = Product::select('category')
            ->distinct()
            ->where('is_active_pos', true)
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->pluck('category')
            ->toArray();
        array_unshift($categories, 'Pizzas');
        return $categories;
    }

    private function getCashRegisterData(): ?array
    {
        if (! Auth::check()) {
            return null;
        }

        $activeRegister = CashRegister::where('user_id', Auth::id())
            ->where('status', 'open')
            ->latest()
            ->first();

        if (! $activeRegister) {
            return null;
        }

        $orders = Order::where('cash_register_id', $activeRegister->id)
            ->where('status', 'paid')
            ->get();

        if ($orders->isEmpty()) {
            $orders = Order::where('user_id', Auth::id())
                ->where('created_at', '>=', $activeRegister->opened_at)
                ->where('status', 'paid')
                ->get();
        }

        return [
            'id' => $activeRegister->id,
            'opening_balance' => (float) $activeRegister->opening_balance,
            'total_sales' => (float) $orders->sum('total_amount'),
            'order_count' => $orders->count(),
            'total_in_drawer' => (float) ($activeRegister->opening_balance + $orders->sum('total_amount')),
        ];
    }

    private function getPizzaSizes(): array
    {
        return PizzaSize::orderBy('id')->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'slices' => $s->slices,
            'max_flavors' => $s->max_flavors,
            'is_broto' => (bool) $s->is_special_broto_rule,
        ])->toArray();
    }

    private function getBorderOptions(): array
    {
        return Product::where('category', 'Extras')
            ->where('name', 'like', '%Borda%')
            ->orderBy('price')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
            ])->toArray();
    }

    /**
     * Create an order from the POS cart.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.id' => 'nullable|string',
                'items.*.type' => 'required|in:product,pizza_flavor,pizza_custom',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.size_id' => 'nullable|string',
                'items.*.flavor_ids' => 'nullable|array',
                'items.*.border_id' => 'nullable|string',
                'items.*.observation' => 'nullable|string',
                // Customer fields
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'nullable|string|max:20',
                // Split Payment: accept array of payments
                'payments' => 'required_without:payment_method|array|min:1',
                'payments.*.method' => 'required_with:payments|string|in:dinheiro,pix,credito,debito',
                'payments.*.amount' => 'required_with:payments|numeric|min:0.01',
                // Legacy single payment (backward compat)
                'payment_method' => 'required_without:payments|nullable|string|in:dinheiro,pix,credito,debito',
            ]);
        } catch (ValidationException $e) {
            Log::error('Validation Failed in POS Checkout:', $e->errors());
            throw $e;
        }

        try {
            $order = $this->createCounterOrderAction->execute($validated, $request->user(), true);
            $totalAmount = (float) $order->total_amount;

            return redirect()->back()->with('success', "Pedido #{$order->short_code} finalizado com sucesso! Total: R$ ".number_format($totalAmount, 2, ',', '.'));
        } catch (OrderActionException $exception) {
            return redirect()->back()->with('error', $exception->getMessage());
        } catch (\Exception $e) {
            Log::error('Error creating POS order', [
                'exception' => $e,
                'user_id' => Auth::id(),
            ]);

            return redirect()->back()->with('error', __('common.error.unexpected'));
        }
    }
}
