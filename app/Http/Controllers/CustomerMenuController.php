<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    public function index(Request $request): Response
    {
        $hasLocaleSelection = $request->has('lang') || $request->cookie('menu_locale_selected') === '1';

        if (! $hasLocaleSelection) {
            return Inertia::render('CustomerMenu/WelcomeLanguage', [
                'availableLocales' => [
                    ['code' => 'pt-BR'],
                    ['code' => 'es-ES'],
                    ['code' => 'en-US'],
                ],
                'menuUrl' => '/menu',
            ]);
        }

        $phone = $request->cookie('customer_phone', '');
        $lastOrder = null;

        if ($phone) {
            $order = \App\Models\Order::where('customer_phone', $phone)
                ->orderByDesc('created_at')
                ->first();

            if ($order) {
                $lastOrder = [
                    'id' => $order->id,
                    'order_code' => $order->order_code ?? $order->id,
                    'status' => $order->status,
                    'total' => $order->total,
                    'items' => collect($order->items ?? [])->map(fn ($item) => [
                        'id' => $item['id'] ?? null,
                        'name' => $item['name'] ?? 'Item',
                        'quantity' => $item['quantity'] ?? 1,
                        'price' => $item['price'] ?? 0,
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
        $phone = $request->cookie('customer_phone', '');
        $orders = [];

        if ($phone) {
            $orders = Order::where('customer_phone', $phone)
                ->orderByDesc('created_at')
                ->limit(30)
                ->get()
                ->map(fn (Order $order) => [
                    'id' => $order->id,
                    'order_code' => $order->order_code ?? $order->id,
                    'status' => $order->status,
                    'total' => $order->total,
                    'items' => collect($order->items ?? [])->map(fn ($item) => [
                        'name' => $item['name'] ?? 'Item',
                        'quantity' => $item['quantity'] ?? 1,
                    ])->all(),
                    'created_at_formatted' => $order->created_at?->format('d/m/Y \à\s H:i'),
                    'created_at' => $order->created_at?->toIso8601String(),
                ])
                ->all();
        }

        return Inertia::render('CustomerMenu/Orders', [
            'orders' => $orders,
        ]);
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

    public function status(Order $order): Response
    {
        return Inertia::render('CustomerMenu/PaymentStatus', [
            'orderId' => $order->id,
            'statusEndpoint' => "/api/orders/{$order->id}/payment-status",
            'whatsappSupportNumber' => config('services.whatsapp.support_number'),
        ]);
    }
}
