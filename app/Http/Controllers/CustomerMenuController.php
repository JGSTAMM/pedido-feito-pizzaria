<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    public function index(Request $request): Response
    {
        $hasLocaleSelection = $request->has('lang')
            || $request->has('locale')
            || $request->cookie('menu_locale_selected') === '1';

        if (! $hasLocaleSelection) {
            return Inertia::render('CustomerMenu/WelcomeLanguage', [
                'availableLocales' => [
                    ['code' => 'pt-BR'],
                    ['code' => 'es-ES'],
                    ['code' => 'en-US'],
                ],
                'menuUrl' => $request->is('/') ? '/' : '/menu',
            ]);
        }

        $ownedIds = (array) $request->session()->get('owned_order_ids', []);
        $lastOrder = null;

        if (! empty($ownedIds)) {
            $order = Order::with(['items.product', 'items.flavors', 'items.pizzaSize'])
                ->whereIn('id', $ownedIds)
                ->orderByDesc('created_at')
                ->first();

            if ($order) {
                $lastOrder = [
                    'id' => $order->id,
                    'order_code' => $order->short_code ?? $order->id,
                    'status' => $order->status,
                    'total' => (float) $order->total_amount,
                    'items' => $order->items->map(fn ($item) => [
                        'id' => $item->id,
                        'name' => $this->resolveItemName($item),
                        'quantity' => $item->quantity ?? 1,
                        'price' => (float) $item->unit_price,
                    ])->all(),
                    'created_at_formatted' => $order->created_at?->format('d/m/Y \à\s H:i'),
                ];
            }
        }

        return Inertia::render('CustomerMenu/Index', [
            'catalogEndpoint' => '/api/digital-menu',
            'lastOrder' => $lastOrder,
        ]);
    }

    public function checkout(Request $request): Response
    {
        return Inertia::render('CustomerMenu/Checkout', [
            'checkoutEndpoint' => '/api/online-orders',
            'prefilledTableCode' => $request->query('table') ?: $request->query('mesa'),
        ]);
    }

    public function orders(Request $request): Response
    {
        $ownedIds = (array) $request->session()->get('owned_order_ids', []);
        $orders = [];

        if (! empty($ownedIds)) {
            $orders = Order::with(['items.product', 'items.flavors', 'items.pizzaSize'])
                ->whereIn('id', $ownedIds)
                ->orderByDesc('created_at')
                ->limit(30)
                ->get()
                ->map(fn (Order $order) => $this->formatOrderForCustomer($order))
                ->all();
        }

        return Inertia::render('CustomerMenu/Orders', [
            'orders' => $orders,
        ]);
    }

    private function formatOrderForCustomer(Order $order): array
    {
        return [
            'id' => $order->id,
            'short_code' => $order->short_code ?? strtoupper(substr($order->id, 0, 5)),
            'status' => $order->status,
            'type' => $order->type,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'delivery_address' => $order->delivery_address,
            'delivery_complement' => $order->delivery_complement,
            'notes' => $order->notes,
            'payment_method_online' => $order->payment_method_online,
            'online_payment_status' => $order->online_payment_status,
            'total_amount' => (float) $order->total_amount,
            'delivery_fee' => (float) $order->delivery_fee,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $this->resolveItemName($item),
                'quantity' => $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
                'notes' => $item->notes,
                'description' => $item->description,
                'type' => $item->type,
            ])->all(),
            'items_count' => $order->items->sum('quantity'),
            'created_at_formatted' => $order->created_at?->format('d/m/Y \à\s H:i'),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function resolveItemName($item): string
    {
        if ($item->type === 'pizza_custom' || $item->type === 'pizza') {
            $size = $item->pizzaSize?->name ?? '';
            $flavors = $item->flavors->pluck('name')->join(', ');

            return trim("{$size} — {$flavors}", ' — ') ?: 'Pizza';
        }

        return $item->product?->name ?? 'Item';
    }

    public function cart(): Response
    {
        return Inertia::render('CustomerMenu/CartPage', [
            'catalogEndpoint' => '/api/digital-menu',
        ]);
    }

    public function storeProfile(): Response
    {
        return Inertia::render('CustomerMenu/StoreProfile');
    }

    public function status(Request $request, Order $order): Response
    {
        $ownedIds = (array) $request->session()->get('owned_order_ids', []);
        $currentOrderId = $request->session()->get('current_order_id');
        $user = $request->user();
        $isStaff = $user && in_array(strtolower(trim((string) $user->role)), ['admin', 'cashier', 'caixa', 'waiter', 'garcom'], true);

        abort_unless(
            $isStaff || $currentOrderId === $order->id || in_array($order->id, $ownedIds, true),
            403,
            __('digital_menu.errors.unauthorized_order_access')
        );

        $order->load(['items.product', 'items.flavors', 'items.pizzaSize']);

        return Inertia::render('CustomerMenu/PaymentStatus', [
            'orderId' => $order->id,
            'orderDetail' => $this->formatOrderForCustomer($order),
            'statusEndpoint' => "/api/orders/{$order->id}/payment-status",
            'whatsappSupportNumber' => config('services.whatsapp.support_number'),
        ]);
    }
}
