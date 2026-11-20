<?php

namespace App\Http\Controllers\Api;

use App\Application\Printing\PrintQueueService;
use App\Http\Controllers\Controller;
use App\Models\PrintJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrintAgentController extends Controller
{
    public function __construct(
        private readonly PrintQueueService $printQueueService
    ) {}

    private function authenticateAgent(Request $request): bool
    {
        $header = (string) $request->header('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return false;
        }

        $token = substr($header, 7);
        $expectedToken = $this->printQueueService->getOrCreateAgentToken();

        return hash_equals($expectedToken, $token);
    }

    public function poll(Request $request): JsonResponse
    {
        if (! $this->authenticateAgent($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Record heartbeat
        $this->printQueueService->recordHeartbeat([
            'version' => (string) $request->input('version', '1.0.0'),
            'printers' => (array) $request->input('printers', []),
            'active_printer' => (string) $request->input('active_printer', ''),
            'ip' => $request->ip(),
        ]);

        $jobs = DB::transaction(function () {
            $pendingJobs = PrintJob::readyToClaim()
                ->lockForUpdate()
                ->orderBy('created_at', 'asc')
                ->limit(5)
                ->get();

            foreach ($pendingJobs as $job) {
                $job->status = 'processing';
                $job->claimed_at = now();
                $job->attempts = (int) $job->attempts + 1;
                $job->save();
            }

            return $pendingJobs;
        });

        return response()->json([
            'jobs' => $jobs,
            'timestamp' => now()->timestamp,
        ]);
    }

    public function ack(Request $request, PrintJob $printJob): JsonResponse
    {
        if (! $this->authenticateAgent($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $success = $request->boolean('success', true);
        $printerName = (string) $request->input('printer_name', '');
        $error = $request->input('error');

        if ($success) {
            $printJob->status = 'printed';
            $printJob->printed_at = now();
            $printJob->printer_name = $printerName ?: $printJob->printer_name;
            $printJob->error_message = null;
        } else {
            if ($printJob->attempts >= 3) {
                $printJob->status = 'failed';
                $printJob->error_message = (string) ($error ?: 'Excedeu o número máximo de tentativas de impressão.');
            } else {
                $printJob->status = 'pending'; // Retry on next poll
                $printJob->error_message = (string) $error;
            }
        }

        $printJob->save();

        return response()->json([
            'success' => true,
            'status' => $printJob->status,
        ]);
    }
}
