<?php

namespace App\Http\Controllers;

use App\Application\Orders\BuildKdsOrdersAction;
use App\Application\Orders\UpdateKdsOrderStatusAction;
use App\Models\Order;
use Inertia\Inertia;

class KdsController extends Controller
{
    public function __construct(
        private readonly BuildKdsOrdersAction $buildKdsOrdersAction,
        private readonly UpdateKdsOrderStatusAction $updateKdsOrderStatusAction,
    ) {
    }

    public function index()
    {
        $orders = $this->buildKdsOrdersAction->execute();
        $counts = $this->buildKdsOrdersAction->buildCounts($orders);

        return Inertia::render('KDS/Index', [
            'orders' => $orders,
            'counts' => $counts,
        ]);
    }

    public function updateStatus(Order $order, $status)
    {
        $this->updateKdsOrderStatusAction->execute($order, (string) $status);

        return redirect()->back();
    }
}
