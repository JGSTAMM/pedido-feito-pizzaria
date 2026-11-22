<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Garante que apenas usuários administradores acessem este controlador.
     */
    public function __construct()
    {
        // Alternativamente, a checagem pode ser feita dentro das funções,
        // mas a melhor abordagem é centralizar.
        // Em apps React/Laravel Inertia, a validação no construtor via middleware closure
        // ou diretamente no método é adequada.
    }

    public function index()
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Acesso Negado: Apenas Administradores podem gerenciar a equipe.');

        $users = User::orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Acesso Negado');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:4',
            'role' => 'required|in:admin,caixa,garcom',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);

        return redirect()->back()->with('success', 'Funcionário cadastrado com sucesso!');
    }

    public function update(Request $request, User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Acesso Negado');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'role' => 'required|in:admin,caixa,garcom',
            'password' => 'nullable|string|min:4',
        ]);

        $credentialsOrRoleChanged = ! empty($validated['password']) || $user->role !== $validated['role'] || $user->email !== $validated['email'];

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($credentialsOrRoleChanged) {
            if (! in_array(strtolower(trim((string) $user->role)), ['admin', 'supervisor'], true)) {
                $user->forceFill(['pin_hash' => null])->save();
            }
            $user->tokens()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        return redirect()->back()->with('success', 'Dados do funcionário atualizados!');
    }

    public function destroy(User $user)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Acesso Negado');

        if (Auth::id() === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Você não pode excluir a si mesmo da plataforma.']);
        }

        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        try {
            $user->delete();
        } catch (QueryException) {
            $user->forceFill([
                'password' => Hash::make(bin2hex(random_bytes(24))),
                'pin_hash' => null,
                'remember_token' => null,
                'role' => 'revoked',
            ])->save();

            return redirect()->back()->with('success', 'Acesso, PIN e sessões do funcionário foram revogados (histórico de caixa preservado).');
        }

        return redirect()->back()->with('success', 'Funcionário desligado do sistema.');
    }
}
