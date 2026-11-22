<?php

namespace App\Application\Security;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AdminPinAuthorizationService
{
    private const UNLOCK_UNTIL_KEY = 'admin_delivery_fee_unlocked_until';

    private const UNLOCK_BY_ID_KEY = 'admin_delivery_fee_unlocked_by';

    private const UNLOCK_BY_NAME_KEY = 'admin_delivery_fee_unlocked_name';

    private const UNLOCK_PIN_DIGEST_KEY = 'admin_delivery_fee_unlocked_pin_digest';

    private const MAX_PIN_ATTEMPTS_PER_MINUTE = 5;

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
    public function verifyAdminPin(string $pin, ?Request $request = null): array
    {
        $rateKey = $this->resolveRateLimitKey($request);
        if (RateLimiter::tooManyAttempts($rateKey, self::MAX_PIN_ATTEMPTS_PER_MINUTE)) {
            return [
                'valid' => false,
                'reason' => 'too_many_attempts',
                'admin' => null,
            ];
        }

        if (! preg_match('/^\d{4}$/', $pin)) {
            RateLimiter::hit($rateKey, 60);

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
            RateLimiter::hit($rateKey, 60);

            return [
                'valid' => false,
                'reason' => 'not_configured',
                'admin' => null,
            ];
        }

        foreach ($admins as $admin) {
            if (Hash::check($pin, $admin->pin_hash)) {
                RateLimiter::clear($rateKey);

                return [
                    'valid' => true,
                    'reason' => null,
                    'admin' => $admin,
                ];
            }
        }

        RateLimiter::hit($rateKey, 60);

        return [
            'valid' => false,
            'reason' => 'invalid_pin',
            'admin' => null,
        ];
    }

    public function isSessionUnlocked(Request $request): bool
    {
        return $this->resolveUnlockedAdmin($request) instanceof User;
    }

    public function grantSessionUnlock(Request $request, User $admin, int $minutes = 15): void
    {
        if (! $request->hasSession() || empty($admin->pin_hash)) {
            return;
        }

        $request->session()->put([
            self::UNLOCK_UNTIL_KEY => now()->addMinutes($minutes)->timestamp,
            self::UNLOCK_BY_ID_KEY => $admin->id,
            self::UNLOCK_BY_NAME_KEY => $admin->name,
            self::UNLOCK_PIN_DIGEST_KEY => hash('sha256', (string) $admin->pin_hash),
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
            self::UNLOCK_PIN_DIGEST_KEY,
        ]);
    }

    /**
     * @return array{can_edit_directly: bool, is_unlocked: bool, unlocked_by_name: string|null, requires_admin_pin: bool}
     */
    public function getDeliveryFeeSecurityState(Request $request): array
    {
        $isAdmin = $this->isAdmin($request->user());
        $unlockedAdmin = $this->resolveUnlockedAdmin($request);
        $sessionUnlocked = $unlockedAdmin instanceof User;

        return [
            'can_edit_directly' => $isAdmin,
            'is_unlocked' => $isAdmin || $sessionUnlocked,
            'unlocked_by_name' => $sessionUnlocked
                ? $unlockedAdmin->name
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

        $unlockedAdmin = $this->resolveUnlockedAdmin($request);
        if ($unlockedAdmin instanceof User) {
            return $unlockedAdmin;
        }

        $providedPin = (string) $request->input('admin_pin', '');
        if ($providedPin !== '') {
            $check = $this->verifyAdminPin($providedPin, $request);
            if ($check['reason'] === 'too_many_attempts') {
                abort(429, 'Muitas tentativas de PIN incorretas. Aguarde um minuto.');
            }
            if ($check['valid'] && $check['admin'] instanceof User) {
                $this->grantSessionUnlock($request, $check['admin']);

                return $check['admin'];
            }

            abort(403, 'PIN do administrador inválido ou não configurado.');
        }

        abort(403, 'Somente o administrador pode alterar taxas de entrega. Solicite o PIN de autorização do administrador.');
    }

    private function resolveUnlockedAdmin(Request $request): ?User
    {
        if (! $request->hasSession()) {
            return null;
        }

        $until = (int) $request->session()->get(self::UNLOCK_UNTIL_KEY, 0);
        $adminId = $request->session()->get(self::UNLOCK_BY_ID_KEY);
        $storedDigest = (string) $request->session()->get(self::UNLOCK_PIN_DIGEST_KEY, '');

        if ($until < now()->timestamp || empty($adminId) || $storedDigest === '') {
            return null;
        }

        $admin = User::find($adminId);
        if (
            ! $admin
            || ! $this->isAdmin($admin)
            || empty($admin->pin_hash)
            || ! hash_equals(hash('sha256', (string) $admin->pin_hash), $storedDigest)
        ) {
            $this->revokeSessionUnlock($request);

            return null;
        }

        return $admin;
    }

    private function resolveRateLimitKey(?Request $request = null): string
    {
        $req = $request ?? request();
        $userId = $req?->user()?->id;

        // Key strictly by authenticated user ID (cannot be bypassed by rotating source IP)
        if ($userId) {
            return "admin-pin-verify:user:{$userId}";
        }

        return 'admin-pin-verify:ip:'.($req?->ip() ?? 'unknown');
    }
}
