<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Services\PizzaPriceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    /**
     * Display the POS page with all catalog data.
     */
    public function index()
    {
        // Load products (exclude archived categories)
        $products = Product::whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
                'category' => $p->category,
                'image_url' => $p->image_url,
                'type' => 'product',
            ]);

        // Load active pizza flavors
        $pizzaFlavors = PizzaFlavor::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
                'price' => (float) $f->base_price,
                'ingredients' => $f->ingredients,
                'flavor_category' => $f->flavor_category,
                'category' => 'Pizzas',
                'image_url' => $f->image_url,
                'type' => 'pizza_flavor',
            ]);

        // Build categories list
        $categories = Product::select('category')
            ->distinct()
            ->whereNotIn('category', ['Arquivo', 'arquivo', 'Extras', 'extras'])
            ->pluck('category')
            ->toArray();
        array_unshift($categories, 'Pizzas');

        // Cash register data
        $cashRegister = null;
        if (Auth::check()) {
            $activeRegister = CashRegister::where('user_id', Auth::id())
                ->where('status', 'open')
                ->latest()
                ->first();

            if ($activeRegister) {
                // Calculate summary
                $orders = Order::where('cash_register_id', $activeRegister->id)
                    ->where('status', 'paid')
                    ->get();

                // Fallback: time-based if no orders linked
                if ($orders->isEmpty()) {
                    $orders = Order::where('user_id', Auth::id())
                        ->where('created_at', '>=', $activeRegister->opened_at)
                        ->where('status', 'paid')
                        ->get();
                }

                $cashRegister = [
                    'id' => $activeRegister->id,
                    'opening_balance' => (float) $activeRegister->opening_balance,
                    'total_sales' => (float) $orders->sum('total_amount'),
                    'order_count' => $orders->count(),
                    'total_in_drawer' => (float) ($activeRegister->opening_balance + $orders->sum('total_amount')),
                ];
            }
        }

        // Load pizza sizes for the builder modal
        $pizzaSizes = PizzaSize::orderBy('id')->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'slices' => $s->slices,
            'max_flavors' => $s->max_flavors,
            'is_broto' => (bool) $s->is_special_broto_rule,
        ]);

        // Load border options (products in Extras category containing 'Borda')
        $borderOptions = Product::where('category', 'Extras')
            ->where('name', 'like', '%Borda%')
            ->orderBy('price')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price,
            ]);

        return Inertia::render('POS/Index', [
            'products' => $products,
            'pizzaFlavors' => $pizzaFlavors,
            'pizzaSizes' => $pizzaSizes,
            'categories' => $categories,
            'borderOptions' => $borderOptions,
            'cashRegister' => $cashRegister,
        ]);
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation Failed in POS Checkout:', $e->errors());
            throw $e;
        }

        // Validate Cash Register State Before Anything Else
        $activeRegister = \App\Models\CashRegister::where('status', 'open')->latest()->first();

        if (!$activeRegister) {
            return redirect()->back()->with('error', 'Operação bloqueada: O caixa está fechado. Peça ao gerente para abrir o caixa.');
        }

        try {
            DB::beginTransaction();

            // Calculate total from server-side prices (security)
            $totalAmount = 0;
            $itemsData = [];

            $priceService = new PizzaPriceService();

            foreach ($validated['items'] as $item) {
                if ($item['type'] === 'product') {
                    $product = Product::findOrFail($item['id']);
                    $unitPrice = (float) $product->price;

                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'product',
                        'product_id' => $item['id'],
                        'pizza_size_id' => null,
                        'flavor_ids' => [],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'description' => $product->name,
                        'notes' => null,
                    ];
                } elseif ($item['type'] === 'pizza_custom') {
                    // Pizza Builder item — validate server-side
                    $sizeId = $item['size_id'];
                    $flavorIds = $item['flavor_ids'] ?? [];
                    $borderId = $item['border_id'] ?? null;
                    $customerObs = $item['observation'] ?? null;

                    $unitPrice = $priceService->calculateItemPrice($sizeId, $flavorIds);
                    $borderName = null;
                    if ($borderId) {
                        $borderProd = Product::find($borderId);
                        if ($borderProd) {
                            $unitPrice += (float) $borderProd->price;
                            $borderName = $borderProd->name;
                        }
                    }

                    $size = PizzaSize::find($sizeId);
                    $flavors = PizzaFlavor::whereIn('id', $flavorIds)->pluck('name')->toArray();

                    // Build a clean description for the item title
                    $sizeName = $size ? $size->name : 'Pizza';
                    $description = "Pizza {$sizeName}";

                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'pizza_custom',
                        'product_id' => null,
                        'pizza_size_id' => $sizeId,
                        'flavor_ids' => $flavorIds,
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'description' => $description,
                        'flavor_names' => $flavors,
                        'border_name' => $borderName,
                        'notes' => $customerObs,
                    ];
                } else {
                    // pizza_flavor — simple add (legacy)
                    $flavor = PizzaFlavor::findOrFail($item['id']);
                    $unitPrice = (float) $flavor->base_price;

                    $subtotal = $unitPrice * $item['quantity'];
                    $totalAmount += $subtotal;

                    $itemsData[] = [
                        'type' => 'pizza_flavor',
                        'product_id' => null,
                        'pizza_size_id' => null,
                        'flavor_ids' => [$item['id']],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                        'notes' => null,
                    ];
                }
            }

            // ── Customer Logic (Omnichannel) ──
            $customerId = null;
            $customerName = $validated['customer_name'];
            $rawPhone = preg_replace('/\D/', '', $validated['customer_phone'] ?? '');

            if (strlen($rawPhone) >= 10) {
                // Phone provided → find or create a Customer record
                $customer = Customer::firstOrCreate(
                    ['phone' => $rawPhone],
                    ['name' => $customerName]
                );
                // Update name if it changed
                if ($customer->name !== $customerName) {
                    $customer->update(['name' => $customerName]);
                }
                $customerId = $customer->id;
            }

            // Create order
            $order = Order::create([
                'status' => 'pending',
                'type' => 'pickup',
                'total_amount' => $totalAmount,
                'customer_name' => $customerName,
                'customer_id' => $customerId,
                'paid_at' => now(),
                'cash_register_id' => $activeRegister?->id,
                'user_id' => Auth::id(),
            ]);

            // Create order items
            foreach ($itemsData as $data) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $data['product_id'],
                    'pizza_size_id' => $data['pizza_size_id'],
                    'quantity' => $data['quantity'],
                    'unit_price' => $data['unit_price'],
                    'subtotal' => $data['subtotal'],
                    'type' => $data['type'],
                    'description' => $data['description'] ?? null,
                    'notes' => $data['notes'],
                ]);

                if (!empty($data['flavor_ids'])) {
                    $fraction = '1/' . count($data['flavor_ids']);
                    foreach ($data['flavor_ids'] as $flavorId) {
                        $orderItem->flavors()->attach($flavorId, [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'fraction' => $fraction
                        ]);
                    }
                }
            }

            // Create payment record(s) — supports split payment
            if (!empty($validated['payments'])) {
                foreach ($validated['payments'] as $paymentData) {
                    Payment::create([
                        'order_id' => $order->id,
                        'method' => $paymentData['method'],
                        'amount' => $paymentData['amount'],
                    ]);
                }
            } else {
                // Legacy single payment fallback
                Payment::create([
                    'order_id' => $order->id,
                    'method' => $validated['payment_method'],
                    'amount' => $totalAmount,
                ]);
            }

            DB::commit();

            return redirect()->back()->with('success', "Pedido #{$order->id} finalizado com sucesso! Total: R$ " . number_format($totalAmount, 2, ',', '.'));

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Erro ao criar pedido: ' . $e->getMessage());
        }
    }
}
