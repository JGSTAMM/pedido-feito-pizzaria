<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\StoreSetting;
use App\Models\User;
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
            'users' => User::orderBy('name')->get(['id', 'name', 'email', 'role']),
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
        ]);
        StoreSetting::first()->update($request->only('store_name', 'cnpj'));
        return redirect()->back()->with('success', 'Perfil atualizado.');
    }

    // ── Users CRUD ──
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,caixa,garcom',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return redirect()->back()->with('success', 'Usuário criado.');
    }

    public function updateUser(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,caixa,garcom',
        ]);

        $data = $request->only('name', 'email', 'role');
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }
        $user->update($data);

        return redirect()->back()->with('success', 'Usuário atualizado.');
    }

    public function destroyUser(User $user)
    {
        if (User::count() <= 1) {
            return redirect()->back()->with('error', 'Não é possível excluir o único usuário.');
        }
        $user->delete();
        return redirect()->back()->with('success', 'Usuário excluído.');
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
