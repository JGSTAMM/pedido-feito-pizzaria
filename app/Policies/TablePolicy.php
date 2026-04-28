<?php

namespace App\Policies;

use App\Models\Table;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TablePolicy
{
    public function closeWithoutPayment(User $user, Table $table): Response
    {
        return $this->isAdminOrCashier($user)
            ? Response::allow()
            : Response::deny(__('auth.unauthorized'));
    }

    public function payAndClose(User $user, Table $table): Response
    {
        return $this->isAdminCashierOrWaiter($user)
            ? Response::allow()
            : Response::deny(__('auth.unauthorized'));
    }

    public function viewOrders(User $user, Table $table): Response
    {
        return $this->isAdminCashierOrWaiter($user)
            ? Response::allow()
            : Response::deny(__('auth.unauthorized'));
    }

    private function isAdminOrCashier(User $user): bool
    {
        $role = $this->normalizeRole((string) ($user->role ?? ''));

        return in_array($role, ['admin', 'cashier'], true);
    }

    private function isAdminCashierOrWaiter(User $user): bool
    {
        $role = $this->normalizeRole((string) ($user->role ?? ''));

        return in_array($role, ['admin', 'cashier', 'waiter'], true);
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
