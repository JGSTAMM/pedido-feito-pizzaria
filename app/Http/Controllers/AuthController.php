<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\StoreSetting;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function showLoginForm()
    {
        // Se o usuário já estiver logado, redireciona pelo middleware de role (simulado aqui)
        if (Auth::check()) {
            if (Auth::user()->role === 'waiter') {
                return redirect()->intended('/waiter');
            }
            return redirect()->intended('/pos');
        }

        $storeName = StoreSetting::first()->store_name ?? 'Pedido Feito';

        return Inertia::render('Auth/Login', [
            'storeName' => $storeName
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Role based redirect
            if (Auth::user()->role === 'waiter') {
                return redirect()->intended('/waiter');
            } elseif (in_array(Auth::user()->role, ['admin', 'cashier'])) {
                return redirect()->intended('/pos');
            }

            // Fallback just in case
            return redirect()->intended('/pos');
        }

        return back()->withErrors([
            'email' => 'As credenciais fornecidas estão incorretas.',
        ])->onlyInput('email');
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
