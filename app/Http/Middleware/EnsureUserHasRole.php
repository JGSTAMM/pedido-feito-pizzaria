<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  array<string>  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        $normalizedAllowedRoles = collect($roles)
            ->map(fn (string $role) => $this->normalizeRole($role))
            ->unique()
            ->all();

        $userRole = $this->normalizeRole((string) ($user->role ?? ''));

        if (!in_array($userRole, $normalizedAllowedRoles, true)) {
            abort(403, __('auth.unauthorized'));
        }

        return $next($request);
    }

    private function normalizeRole(string $role): string
    {
        return match (strtolower(trim($role))) {
            'caixa' => 'cashier',
            'garcom' => 'waiter',
            default => strtolower(trim($role)),
        };
    }
}
