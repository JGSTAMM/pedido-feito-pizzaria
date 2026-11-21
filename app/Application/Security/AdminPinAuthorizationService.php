<?php

namespace App\Application\Security;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminPinAuthorizationService
{
    private const UNLOCK_UNTIL_KEY = 'admin_delivery_fee_unlocked_until';

    private const UNLOCK_BY_ID_KEY = 'admin_delivery_fee_unlocked_by';

    private const UNLOCK_BY_NAME_KEY = 'admin_delivery_fee_unlocked_name';

    public function isAdmin(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return strtolower(trim((string) $user->role)) === 'admin';
    }

    /**
     * @return array{valid: bool, reason: string|null, admin: User|null}
     */
    public function verifyAdminPin(string $pin): array
    {
        if (! preg_match('/^\d{4}$/', $pin)) {
            return [
                'valid' => false,
                'reason' => 'invalid_pin',
                'admin' => null,
            ];
        }

        $admins = User::query()
            ->whereRaw('LOWER(TRIM(role)) = ?', ['admin'])
            ->whereNotNull('pin_hash')
            ->get();

        if ($admins->isEmpty()) {
            return [
                'valid' => false,
                'reason' => 'not_configured',
                'admin' => null,
            ];
        }

        foreach ($admins as $admin) {
            if (Hash::check($pin, $admin->pin_hash)) {
                return [
                    'valid' => true,
                    'reason' => null,
                    'admin' => $admin,
                ];
            }
        }

        return [
            'valid' => false,
            'reason' => 'invalid_pin',
            'admin' => null,
        ];
    }

    public function isSessionUnlocked(Request $request): bool
    {
        if (! $request->hasSession()) {
            return false;
        }

        $until = (int) $request->session()->get(self::UNLOCK_UNTIL_KEY, 0);
        $adminId = $request->session()->get(self::UNLOCK_BY_ID_KEY);

        return $until >= now()->timestamp && ! empty($adminId);
    }

    public function grantSessionUnlock(Request $request, User $admin, int $minutes = 15): void
    {
        if (! $request->hasSession()) {
            return;
        }

        $request->session()->put([
            self::UNLOCK_UNTIL_KEY => now()->addMinutes($minutes)->timestamp,
            self::UNLOCK_BY_ID_KEY => $admin->id,
            self::UNLOCK_BY_NAME_KEY => $admin->name,
        ]);
    }

    public function revokeSessionUnlock(Request $request): void
    {
        if (! $request->hasSession()) {
            return;
        }

        $request->session()->forget([
            self::UNLOCK_UNTIL_KEY,
            self::UNLOCK_BY_ID_KEY,
            self::UNLOCK_BY_NAME_KEY,
        ]);
    }

    /**
     * @return array{can_edit_directly: bool, is_unlocked: bool, unlocked_by_name: string|null, requires_admin_pin: bool}
     */
    public function getDeliveryFeeSecurityState(Request $request): array
    {
        $isAdmin = $this->isAdmin($request->user());
        $sessionUnlocked = $this->isSessionUnlocked($request);

        return [
            'can_edit_directly' => $isAdmin,
            'is_unlocked' => $isAdmin || $sessionUnlocked,
            'unlocked_by_name' => $sessionUnlocked
                ? $request->session()->get(self::UNLOCK_BY_NAME_KEY)
                : null,
            'requires_admin_pin' => ! $isAdmin,
        ];
    }

    public function authorizeOrFail(Request $request): User
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        if ($this->isAdmin($user)) {
            return $user;
        }

        if ($this->isSessionUnlocked($request)) {
            $adminId = $request->session()->get(self::UNLOCK_BY_ID_KEY);
            $admin = User::find($adminId);
            if ($admin && $this->isAdmin($admin)) {
                return $admin;
            }
            $this->revokeSessionUnlock($request);
        }

        $providedPin = (string) $request->input('admin_pin', '');
        if ($providedPin !== '') {
            $check = $this->verifyAdminPin($providedPin);
            if ($check['valid'] && $check['admin'] instanceof User) {
                $this->grantSessionUnlock($request, $check['admin']);

                return $check['admin'];
            }

            abort(403, 'PIN do administrador inválido ou não configurado.');
        }

        abort(403, 'Somente o administrador pode alterar taxas de entrega. Solicite o PIN de autorização do administrador.');
    }
}
