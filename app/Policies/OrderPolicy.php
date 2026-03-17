<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrderPolicy
{
    public function closeCashRegister(User $user): Response
    {
        return $this->isAdminOrCashier($user)
            ? Response::allow()
            : Response::deny(__('auth.unauthorized'));
    }

    private function isAdminOrCashier(User $user): bool
    {
        $role = $this->normalizeRole((string) ($user->role ?? ''));

        return in_array($role, ['admin', 'cashier'], true);
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
