<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Display the login view.
     */
    public function showLoginForm()
    {
        // Se o usuário já estiver logado, redireciona pelo middleware de role
        if (Auth::check()) {
            $role = Auth::user()->role;
            if (in_array($role, ['waiter', 'garcom'])) {
                session()->forget('url.intended');
                return redirect('/waiter');
            }

            return redirect()->intended('/pos');
        }

        $storeName = StoreSetting::first()->store_name ?? 'Pedido Feito';

        return Inertia::render('Auth/Login', [
            'storeName' => $storeName,
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

        $throttleKey = Str::transliterate(Str::lower((string) $request->input('email')).'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'email' => "Muitas tentativas de login. Tente novamente em {$seconds} segundos.",
            ]);
        }

        if (Auth::attempt($credentials)) {
            RateLimiter::clear($throttleKey);
            $request->session()->regenerate();

            // Role based redirect
            $role = Auth::user()->role;
            if (in_array($role, ['waiter', 'garcom'])) {
                session()->forget('url.intended');
                return redirect('/waiter');
            } elseif (in_array($role, ['admin', 'cashier', 'caixa'])) {
                return redirect()->intended('/pos');
            }

            // Fallback just in case
            return redirect()->intended('/pos');
        }

        RateLimiter::hit($throttleKey, 60);

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
