<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $storeSetting = \App\Models\StoreSetting::first();
        
        $phone = $request->cookie('customer_phone', '');
        $activeOrdersCount = 0;

        if ($phone) {
            $activeOrdersCount = \App\Models\Order::where('customer_phone', $phone)
                ->whereNotIn('status', ['delivered', 'completed', 'cancelled'])
                ->count();
        }
        
        return [
            ...parent::share($request),
            'appName' => $storeSetting->store_name ?? config('app.name', 'Pedido Feito'),
            'locale' => app()->getLocale(),
            'fallbackLocale' => config('app.fallback_locale'),
            'storeSetting' => $storeSetting,
            'activeOrdersCount' => $activeOrdersCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
