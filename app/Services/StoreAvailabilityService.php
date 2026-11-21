<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\StoreSetting;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class StoreAvailabilityService
{
    private const DAY_MAP = [
        0 => 'sunday',
        1 => 'monday',
        2 => 'tuesday',
        3 => 'wednesday',
        4 => 'thursday',
        5 => 'friday',
        6 => 'saturday',
    ];

    /**
     * Evaluate whether the digital menu can accept online orders right now.
     *
     * @return array<string, mixed>
     */
    public function evaluate(?StoreSetting $setting = null, ?CarbonInterface $now = null): array
    {
        $setting ??= StoreSetting::first();
        $timezone = config('app.timezone', 'America/Sao_Paulo');
        $currentTime = $now
            ? CarbonImmutable::instance($now)->setTimezone($timezone)
            : CarbonImmutable::now($timezone);

        $isStoreOpen = $setting ? (bool) $setting->is_open : true;
        $activeRegister = CashRegister::where('status', 'open')->latest()->first();
        $isCashRegisterOpen = $activeRegister !== null;

        $openingHours = $setting?->opening_hours;
        $isWithinHours = $this->isWithinOpeningHours(
            is_array($openingHours) ? $openingHours : null,
            $currentTime
        );
        $todayHours = $this->formatTodayHours(
            is_array($openingHours) ? $openingHours : null,
            $currentTime
        );

        $reason = $this->resolveClosedReason($isStoreOpen, $isCashRegisterOpen, $isWithinHours);
        $isAcceptingOrders = $reason === null;

        return [
            'is_accepting_orders' => $isAcceptingOrders,
            'reason' => $reason,
            'message' => $this->resolveMessage($reason, $todayHours),
            'is_store_open' => $isStoreOpen,
            'is_cash_register_open' => $isCashRegisterOpen,
            'is_within_opening_hours' => $isWithinHours,
            'cash_register_id' => $activeRegister?->id,
            'today_hours' => $todayHours,
        ];
    }

    private function resolveClosedReason(bool $isStoreOpen, bool $isCashRegisterOpen, bool $isWithinHours): ?string
    {
        if (! $isStoreOpen) {
            return 'store_closed';
        }

        if (! $isCashRegisterOpen) {
            return 'cash_register_closed';
        }

        if (! $isWithinHours) {
            return 'outside_hours';
        }

        return null;
    }

    private function resolveMessage(?string $reason, ?string $todayHours): ?string
    {
        if ($reason === null) {
            return null;
        }

        if ($reason === 'outside_hours' && $todayHours) {
            return __('digital_menu.availability.outside_hours_with_schedule', ['hours' => $todayHours]);
        }

        return __("digital_menu.availability.{$reason}");
    }

    private function isWithinOpeningHours(?array $openingHours, CarbonImmutable $now): bool
    {
        if (empty($openingHours)) {
            return true;
        }

        foreach ([$now, $now->subDay()] as $referenceDay) {
            $dayKey = self::DAY_MAP[$referenceDay->dayOfWeek] ?? null;
            $config = $dayKey ? ($openingHours[$dayKey] ?? null) : null;

            if (is_array($config) && $this->matchesWindow($referenceDay, $config, $now)) {
                return true;
            }
        }

        return false;
    }

    private function matchesWindow(CarbonImmutable $dayDate, array $config, CarbonImmutable $now): bool
    {
        if (! empty($config['closed']) || empty($config['open']) || empty($config['close'])) {
            return false;
        }

        $start = $dayDate->setTimeFromTimeString((string) $config['open']);
        $end = $dayDate->setTimeFromTimeString((string) $config['close']);

        // Overnight windows (e.g. 18:00 - 00:00 or 18:00 - 02:00) end on the next calendar day.
        if ($end->lessThanOrEqualTo($start)) {
            $end = $end->addDay();
        }

        return $now->greaterThanOrEqualTo($start) && $now->lessThan($end);
    }

    private function formatTodayHours(?array $openingHours, CarbonImmutable $now): ?string
    {
        if (empty($openingHours)) {
            return null;
        }

        $todayKey = self::DAY_MAP[$now->dayOfWeek] ?? null;
        $todayConfig = $todayKey ? ($openingHours[$todayKey] ?? null) : null;

        if (! is_array($todayConfig) || ! empty($todayConfig['closed']) || empty($todayConfig['open']) || empty($todayConfig['close'])) {
            return null;
        }

        return "{$todayConfig['open']} – {$todayConfig['close']}";
    }
}
