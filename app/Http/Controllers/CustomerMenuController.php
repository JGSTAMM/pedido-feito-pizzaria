<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('CustomerMenu/Index', [
            'catalogEndpoint' => '/api/digital-menu',
        ]);
    }

    public function checkout(): Response
    {
        return Inertia::render('CustomerMenu/Checkout', [
            'checkoutEndpoint' => '/api/online-orders',
        ]);
    }

    public function status(Order $order): Response
    {
        return Inertia::render('CustomerMenu/PaymentStatus', [
            'orderId' => $order->id,
            'statusEndpoint' => "/api/orders/{$order->id}/payment-status",
        ]);
    }
}
