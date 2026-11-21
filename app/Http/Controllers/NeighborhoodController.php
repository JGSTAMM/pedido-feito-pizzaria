<?php

namespace App\Http\Controllers;

use App\Application\Security\AdminPinAuthorizationService;
use App\Models\Neighborhood;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NeighborhoodController extends Controller
{
    public function __construct(
        private readonly AdminPinAuthorizationService $adminPinService,
    ) {}

    public function index(Request $request)
    {
        $neighborhoods = Neighborhood::select('id', 'name', 'city', 'delivery_fee', 'observation')
            ->orderBy('city')
            ->orderBy('name')
            ->get();

        return Inertia::render('Neighborhoods/Index', [
            'neighborhoods' => $neighborhoods,
            'deliveryFeeSecurity' => $this->adminPinService->getDeliveryFeeSecurityState($request),
        ]);
    }

    public function validateAdminPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ]);

        $check = $this->adminPinService->verifyAdminPin($validated['pin']);

        if (! $check['valid'] || ! $check['admin']) {
            return response()->json([
                'valid' => false,
                'reason' => $check['reason'],
            ], 401);
        }

        $this->adminPinService->grantSessionUnlock($request, $check['admin']);

        return response()->json([
            'valid' => true,
            'admin_name' => $check['admin']->name,
            'admin_id' => $check['admin']->id,
        ]);
    }

    public function lockAdminPin(Request $request)
    {
        $this->adminPinService->revokeSessionUnlock($request);

        return redirect()->back()->with('success', 'Alteração de taxas bloqueada novamente.');
    }

    public function store(Request $request)
    {
        $this->adminPinService->authorizeOrFail($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'delivery_fee' => 'required|numeric|min:0|max:9999.99',
            'observation' => 'nullable|string|max:255',
        ]);

        Neighborhood::create($validated);

        return redirect()->back()->with('success', 'Bairro/Taxa adicionado com sucesso!');
    }

    public function update(Request $request, Neighborhood $neighborhood)
    {
        $this->adminPinService->authorizeOrFail($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'delivery_fee' => 'required|numeric|min:0|max:9999.99',
            'observation' => 'nullable|string|max:255',
        ]);

        $neighborhood->update($validated);

        return redirect()->back()->with('success', 'Bairro/Taxa atualizado com sucesso!');
    }

    public function bulkUpdate(Request $request)
    {
        $this->adminPinService->authorizeOrFail($request);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|string|exists:neighborhoods,id',
            'items.*.delivery_fee' => 'required|numeric|min:0|max:9999.99',
            'items.*.observation' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['items'] as $item) {
                $neighborhood = Neighborhood::find($item['id']);
                if ($neighborhood) {
                    $neighborhood->update([
                        'delivery_fee' => $item['delivery_fee'],
                        'observation' => array_key_exists('observation', $item)
                            ? $item['observation']
                            : $neighborhood->observation,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Taxas de tele-entrega atualizadas com sucesso!');
    }

    public function destroy(Request $request, Neighborhood $neighborhood)
    {
        $this->adminPinService->authorizeOrFail($request);

        $neighborhood->delete();

        return redirect()->back()->with('success', 'Bairro/Taxa removido com sucesso!');
    }
}
