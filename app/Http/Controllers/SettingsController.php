<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\StoreSetting;
use App\Models\Printer;

class SettingsController extends Controller
{
    public function index()
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
                ]
            ]
        );

        return Inertia::render('Settings/Index', [
            'settings' => $settings,
            'printers' => Printer::orderBy('name')->get(),
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
            'description' => 'nullable|string|max:500',
            'remove_logo' => 'nullable|boolean',
            'remove_cover' => 'nullable|boolean',
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
            'receipt_footer' => 'nullable|string',
            'receipt_show_cnpj' => 'required|boolean',
        ]);
        StoreSetting::first()->update($request->only('receipt_header_1', 'receipt_header_2', 'receipt_footer', 'receipt_show_cnpj'));
        return redirect()->back()->with('success', 'Configurações de Recibo atualizadas.');
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
}
