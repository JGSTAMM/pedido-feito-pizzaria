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

        $rawPrinters = is_array($request->input('printers')) ? array_slice($request->input('printers'), 0, 25) : [];
        $sanitizedPrinters = array_values(array_filter(array_map(
            fn ($p) => is_scalar($p) ? mb_substr(trim((string) $p), 0, 120) : '',
            $rawPrinters
        )));

        // Record heartbeat
        $this->printQueueService->recordHeartbeat([
            'version' => mb_substr(trim((string) $request->input('version', '1.0.0')), 0, 32),
            'platform' => mb_substr(trim((string) $request->input('platform', '')), 0, 32),
            'printers' => $sanitizedPrinters,
            'active_printer' => mb_substr(trim((string) $request->input('active_printer', '')), 0, 120),
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
        $printerName = mb_substr(trim((string) $request->input('printer_name', '')), 0, 120);
        $error = $request->input('error') !== null
            ? mb_substr(trim((string) $request->input('error')), 0, 500)
            : null;

        return DB::transaction(function () use ($printJob, $success, $printerName, $error): JsonResponse {
            /** @var PrintJob|null $lockedJob */
            $lockedJob = PrintJob::where('id', $printJob->id)->lockForUpdate()->first();
            if (! $lockedJob) {
                return response()->json(['error' => 'Print job not found'], 404);
            }

            if ($lockedJob->status !== 'processing') {
                return response()->json([
                    'success' => false,
                    'error' => 'Print job must be claimed (processing) before acknowledgment.',
                    'status' => $lockedJob->status,
                ], 409);
            }

            if ($success) {
                $lockedJob->status = 'printed';
                $lockedJob->printed_at = now();
                $lockedJob->printer_name = $printerName !== '' ? $printerName : $lockedJob->printer_name;
                $lockedJob->error_message = null;
            } else {
                if ($lockedJob->attempts >= 3) {
                    $lockedJob->status = 'failed';
                    $lockedJob->error_message = (string) ($error ?: 'Excedeu o número máximo de tentativas de impressão.');
                } else {
                    $lockedJob->status = 'pending'; // Retry on next poll
                    $lockedJob->error_message = (string) $error;
                }
            }

            $lockedJob->save();

            return response()->json([
                'success' => true,
                'status' => $lockedJob->status,
            ]);
        });
    }
}
