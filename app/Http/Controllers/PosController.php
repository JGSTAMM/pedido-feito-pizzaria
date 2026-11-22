<?php

namespace App\Http\Controllers;

use App\Application\CashRegister\CashRegisterLockService;
use App\Application\Orders\CreateCounterOrderAction;
use App\Application\Orders\OrderActionException;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PosController extends Controller
{
    public function __construct(
        private readonly CreateCounterOrderAction $createCounterOrderAction,
        private readonly CashRegisterLockService $cashRegisterLockService,
        private readonly PaymentGatewayService $paymentGatewayService,
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
                'items' => 'required|array|min:1|max:50',
                'items.*.id' => 'nullable|string',
                'items.*.type' => 'required|in:product,pizza_flavor,pizza_custom',
                'items.*.quantity' => 'required|integer|min:1|max:50',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.size_id' => 'required_if:items.*.type,pizza_custom|nullable|uuid|exists:pizza_sizes,id',
                'items.*.flavor_ids' => 'required_if:items.*.type,pizza_custom|nullable|array|min:1',
                'items.*.flavor_ids.*' => 'uuid|exists:pizza_flavors,id',
                'items.*.border_id' => 'nullable|uuid|exists:products,id',
                'items.*.observation' => 'nullable|string',
                // Customer fields
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'nullable|string|max:20',
                // Split Payment: accept array of payments
                'payments' => 'required_without:payment_method|array|min:1',
                'payments.*.method' => 'required_with:payments|string|in:dinheiro,pix,pix_balcao,credito,debito',
                'payments.*.amount' => 'required_with:payments|numeric|min:0.01',
                'payments.*.gateway_id' => 'nullable|string|max:100',
                // Legacy single payment (backward compat)
                'payment_method' => 'required_without:payments|nullable|string|in:dinheiro,pix,pix_balcao,credito,debito',
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

    /**
     * Generate a dynamic Mercado Pago PIX QR Code for counter (POS) checkout before order submission.
     */
    public function generatePix(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'customer_name' => 'nullable|string|max:120',
        ]);

        try {
            $this->cashRegisterLockService->requireOpenRegister();
        } catch (OrderActionException $exception) {
            return response()->json(['error' => $exception->getMessage()], 400);
        }

        $amount = (float) $validated['amount'];
        $customerLabel = trim((string) ($validated['customer_name'] ?? ''));
        $description = $customerLabel !== ''
            ? "Venda Balcão ({$customerLabel}) - Pedido Feito"
            : 'Venda Balcão - Pedido Feito Pizzaria';

        $result = $this->paymentGatewayService->createStandalonePixPayment(
            amount: $amount,
            description: $description,
            payerEmail: 'pagamento@pedidofeito.com',
        );

        if (! ($result['success'] ?? false)) {
            return response()->json([
                'error' => $result['error'] ?? 'Erro ao gerar PIX.',
            ], 500);
        }

        $gatewayPaymentId = (string) $result['data']['gateway_payment_id'];
        $ownedIds = array_values(array_unique([
            ...((array) $request->session()->get('pos_pix_payment_ids', [])),
            $gatewayPaymentId,
        ]));
        $request->session()->put('pos_pix_payment_ids', array_slice($ownedIds, -20));

        return response()->json([
            'success' => true,
            'gateway_payment_id' => $gatewayPaymentId,
            'qr_code' => $result['data']['qr_code'],
            'qr_code_base64' => $result['data']['qr_code_base64'],
            'expires_at' => $result['data']['expires_at'],
        ]);
    }

    /**
     * Poll Mercado Pago status for a POS counter standalone PIX payment.
     */
    public function pixPaymentStatus(Request $request, string $gatewayPaymentId)
    {
        $ownedIds = (array) $request->session()->get('pos_pix_payment_ids', []);

        if (! in_array($gatewayPaymentId, $ownedIds, true)) {
            return response()->json(['error' => 'Unauthorized payment status lookup.'], 403);
        }

        $status = $this->paymentGatewayService->checkGatewayPaymentStatus($gatewayPaymentId);

        return response()->json([
            'status' => $status ?? 'pending',
        ]);
    }
}
