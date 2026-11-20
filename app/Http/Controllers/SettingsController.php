<?php

namespace App\Http\Controllers;

use App\Application\Printing\PrintQueueService;
use App\Models\Printer;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __construct(
        private readonly PrintQueueService $printQueueService,
    ) {}

    public function index(Request $request)
    {
        $settings = StoreSetting::firstOrCreate(
            ['id' => 1],
            [
                'store_name' => 'Pedido Feito',
                'cnpj' => '00.000.000/0001-00',
                'is_open' => true,
                'opening_hours' => [
                    'monday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                    'tuesday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                    'wednesday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                    'thursday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                    'friday' => ['open' => '18:00', 'close' => '00:00', 'closed' => false],
                    'saturday' => ['open' => '18:00', 'close' => '00:00', 'closed' => false],
                    'sunday' => ['open' => '18:00', 'close' => '23:30', 'closed' => false],
                ],
            ]
        );

        $currentUser = $request->user();
        $isAdmin = $currentUser && strtolower((string) $currentUser->role) === 'admin';

        $supervisors = $isAdmin
            ? User::whereIn('role', ['admin', 'supervisor'])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'pin_hash'])
                ->map(fn (User $supervisor) => [
                    'id' => $supervisor->id,
                    'name' => $supervisor->name,
                    'email' => $supervisor->email,
                    'role' => $supervisor->role,
                    'has_pin' => ! empty($supervisor->pin_hash),
                ])
                ->values()
            : [];

        return Inertia::render('Settings/Index', [
            'settings' => $settings->makeVisible(['mercadopago_access_token', 'google_maps_api_key', 'ifood_merchant_id']),
            'printers' => Printer::orderBy('name')->get(),
            'printAgent' => [
                'token' => $this->printQueueService->getOrCreateAgentToken(),
                'status' => $this->printQueueService->getAgentStatus(),
            ],
            'supervisorSecurity' => [
                'can_manage' => $isAdmin,
                'current_user_id' => $currentUser?->id,
                'supervisors' => $supervisors,
            ],
        ]);
    }

    // ── Store Status ──
    public function updateStoreStatus(Request $request)
    {
        $request->validate(['is_open' => 'required|boolean']);
        StoreSetting::first()->update(['is_open' => $request->is_open]);

        return redirect()->back()->with('success', 'Status da loja atualizado.');
    }

    // ── Opening Hours ──
    public function updateOpeningHours(Request $request)
    {
        $request->validate(['opening_hours' => 'required|array']);
        StoreSetting::first()->update(['opening_hours' => $request->opening_hours]);

        return redirect()->back()->with('success', 'Horários atualizados.');
    }

    // ── Profile ──
    public function updateProfile(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'cnpj' => 'required|string|max:30',
            'phone' => 'nullable|string|max:30',
            'full_address' => 'nullable|string|max:500',
            'google_maps_embed_url' => 'nullable|string',
            'google_maps_place_url' => 'nullable|string',
            'payment_methods' => 'nullable|array',
            'custom_info' => 'nullable|string',
        ]);
        StoreSetting::first()->update($request->only(
            'store_name',
            'cnpj',
            'phone',
            'full_address',
            'google_maps_embed_url',
            'google_maps_place_url',
            'payment_methods',
            'custom_info'
        ));

        return redirect()->back()->with('success', 'Perfil da loja atualizado.');
    }

    // -- Branding (Cover, Logo, Description) --
    public function updateBranding(Request $request)
    {
        $request->validate([
            'cover_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'logo_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'story_media' => 'nullable|array|max:5',
            'update_stories' => 'nullable|boolean',
            'description' => 'nullable|string|max:500',
            'remove_logo' => 'nullable|boolean',
            'remove_cover' => 'nullable|boolean',
        ], [
            'story_media.max' => 'Você pode adicionar no máximo 5 histórias.',
            'cover_image.max' => 'A imagem de capa não pode ter mais que 5MB.',
            'logo_image.max' => 'A logo não pode ter mais que 5MB.',
        ]);

        $settings = StoreSetting::first();
        $data = [];

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('branding', 'public');
        } elseif ($request->boolean('remove_cover')) {
            $data['cover_image'] = null;
        }

        if ($request->hasFile('logo_image')) {
            $data['logo_image'] = $request->file('logo_image')->store('branding', 'public');
        } elseif ($request->boolean('remove_logo')) {
            $data['logo_image'] = null;
        }

        if ($request->boolean('update_stories')) {
            $newStoryMedia = [];
            if ($request->has('story_media') && is_array($request->story_media)) {
                foreach ($request->story_media as $item) {
                    if ($item instanceof \Illuminate\Http\UploadedFile) {
                        $path = $item->store('branding', 'public');
                        $mime = $item->getMimeType();
                        $newStoryMedia[] = [
                            'url' => $path,
                            'type' => str_starts_with($mime, 'video') ? 'video' : 'image',
                        ];
                    } else if (is_array($item) && isset($item['url'])) {
                        // Strip absolute domain and 'storage/' prefix if present to save only the relative path
                        $url = $item['url'];
                        if (str_contains($url, '/storage/')) {
                            $url = explode('/storage/', $url)[1];
                        }
                        $newStoryMedia[] = [
                            'url' => $url,
                            'type' => $item['type'] ?? 'image',
                        ];
                    }
                }
            }
            $data['story_media'] = $newStoryMedia;
        }

        if ($request->has('description')) {
            $data['description'] = $request->description;
        }

        if (count($data) > 0) {
            $settings->update($data);
        }

        return redirect()->back()->with('success', 'Branding atualizado.');
    }

    // ── Receipt ──
    public function updateReceipt(Request $request)
    {
        $request->validate([
            'receipt_header_1' => 'nullable|string|max:255',
            'receipt_header_2' => 'nullable|string|max:255',
            'cnpj' => 'nullable|string|max:30',
            'receipt_footer' => 'nullable|string',
            'receipt_show_cnpj' => 'required|boolean',
        ]);
        StoreSetting::first()->update($request->only('receipt_header_1', 'receipt_header_2', 'cnpj', 'receipt_footer', 'receipt_show_cnpj'));

        return redirect()->back()->with('success', 'Configurações de Recibo atualizadas.');
    }

    // ── Integrations ──
    public function updateIntegrations(Request $request)
    {
        $request->validate([
            'mercadopago_access_token' => 'nullable|string|max:500',
            'whatsapp_phone_number' => 'nullable|string|max:500',
            'google_maps_api_key' => 'nullable|string|max:500',
            'ifood_merchant_id' => 'nullable|string|max:500',
        ]);

        StoreSetting::first()->update($request->only(
            'mercadopago_access_token',
            'whatsapp_phone_number',
            'google_maps_api_key',
            'ifood_merchant_id'
        ));

        // Token is stored exclusively in the database (store_settings table).
        // PaymentGatewayService reads it from there at runtime.

        return redirect()->back()->with('success', 'Integrações atualizadas.');
    }

    // ── Printers CRUD ──
    public function storePrinter(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:receipt,production',
            'target' => 'required|in:cash_register,kitchen',
            'ip_address' => 'nullable|string|max:50',
        ]);

        Printer::create($request->only('name', 'type', 'target', 'ip_address'));

        return redirect()->back()->with('success', 'Impressora adicionada.');
    }

    public function updatePrinter(Request $request, Printer $printer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:receipt,production',
            'target' => 'required|in:cash_register,kitchen',
            'ip_address' => 'nullable|string|max:50',
        ]);

        $printer->update($request->only('name', 'type', 'target', 'ip_address'));

        return redirect()->back()->with('success', 'Impressora atualizada.');
    }

    public function destroyPrinter(Printer $printer)
    {
        $printer->delete();

        return redirect()->back()->with('success', 'Impressora excluída.');
    }

    public function testPrint(Request $request)
    {
        $target = (string) $request->input('target', 'kitchen');
        $this->printQueueService->enqueueTestTicket($target);

        return redirect()->back()->with('success', 'Teste de impressão enviado para a fila do agente!');
    }

    public function regenerateAgentToken()
    {
        $this->printQueueService->regenerateAgentToken();

        return redirect()->back()->with('success', 'Novo token de conexão gerado com sucesso!');
    }

    // ── Supervisor Security PIN ──
    public function updateSupervisorPin(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'pin' => ['required', 'string', 'regex:/^\d{4}$/', 'confirmed'],
        ], [
            'pin.required' => 'Informe o PIN de 4 dígitos.',
            'pin.regex' => 'O PIN deve conter exatamente 4 dígitos numéricos.',
            'pin.confirmed' => 'A confirmação do PIN não confere.',
        ]);

        $targetUser = ! empty($validated['user_id'])
            ? User::findOrFail($validated['user_id'])
            : $request->user();

        if (! $targetUser || ! in_array(strtolower((string) $targetUser->role), ['admin', 'supervisor'], true)) {
            return redirect()->back()->withErrors([
                'user_id' => 'Apenas administradores ou supervisores podem possuir PIN de autorização.',
            ]);
        }

        $duplicatePinExists = User::whereIn('role', ['admin', 'supervisor'])
            ->where('id', '!=', $targetUser->id)
            ->whereNotNull('pin_hash')
            ->get()
            ->contains(fn (User $other) => Hash::check($validated['pin'], $other->pin_hash));

        if ($duplicatePinExists) {
            return redirect()->back()->withErrors([
                'pin' => 'Este PIN já está em uso por outro supervisor. Escolha outro código de 4 dígitos.',
            ]);
        }

        $targetUser->pin_hash = Hash::make($validated['pin']);
        $targetUser->save();

        return redirect()->back()->with('success', 'PIN do supervisor atualizado com sucesso.');
    }

    public function clearSupervisorPin(User $user)
    {
        if (! in_array(strtolower((string) $user->role), ['admin', 'supervisor'], true)) {
            abort(422, 'Apenas administradores ou supervisores possuem PIN de autorização.');
        }

        $user->pin_hash = null;
        $user->save();

        return redirect()->back()->with('success', 'PIN do supervisor removido com sucesso.');
    }
}
