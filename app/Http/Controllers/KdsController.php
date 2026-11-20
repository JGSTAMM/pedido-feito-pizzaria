<?php

namespace App\Http\Controllers;

use App\Application\Orders\BuildKdsOrdersAction;
use App\Application\Orders\UpdateKdsOrderStatusAction;
use App\Application\Printing\PrintQueueService;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class KdsController extends Controller
{
    public function __construct(
        private readonly BuildKdsOrdersAction $buildKdsOrdersAction,
        private readonly UpdateKdsOrderStatusAction $updateKdsOrderStatusAction,
        private readonly PrintQueueService $printQueueService,
    ) {}

    public function index()
    {
        $orders = $this->buildKdsOrdersAction->execute();
        $counts = $this->buildKdsOrdersAction->buildCounts($orders);

        return Inertia::render('KDS/Index', [
            'orders' => $orders,
            'counts' => $counts,
            'printAgent' => $this->printQueueService->getAgentStatus(),
        ]);
    }

    public function updateStatus(Order $order, $status)
    {
        $this->updateKdsOrderStatusAction->execute($order, (string) $status);

        return redirect()->back();
    }

    public function reprint(Order $order): JsonResponse
    {
        $job = $this->printQueueService->enqueueKitchenTicket($order, force: true);
        $agentStatus = $this->printQueueService->getAgentStatus();

        return response()->json([
            'success' => true,
            'job_id' => $job?->id,
            'agent_online' => $agentStatus['is_online'],
        ]);
    }

    public function agentStatus(): JsonResponse
    {
        return response()->json($this->printQueueService->getAgentStatus());
    }
}
