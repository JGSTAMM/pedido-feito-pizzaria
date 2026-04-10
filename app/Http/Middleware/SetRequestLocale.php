<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class SetRequestLocale
{
    private const LOCALE_COOKIE = 'app_locale';
    private const MENU_LOCALE_SELECTED_COOKIE = 'menu_locale_selected';

    private const SUPPORTED_LOCALES = [
        'pt-BR',
        'en-US',
        'es-ES',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $queryLocale = $this->normalizeLocale($request->query('locale') ?? $request->query('lang'));
        $cookieLocale = $this->normalizeLocale($request->cookie(self::LOCALE_COOKIE));

        $resolvedLocale = $queryLocale ?? $cookieLocale ?? 'pt-BR';

        App::setLocale(str_replace('-', '_', $resolvedLocale));

        if ($queryLocale !== null) {
            Cookie::queue(cookie()->forever(self::LOCALE_COOKIE, $queryLocale));
            Cookie::queue(cookie()->forever(self::MENU_LOCALE_SELECTED_COOKIE, '1'));
        }

        return $next($request);
    }

    private function normalizeLocale(?string $locale): ?string
    {
        if ($locale === null || $locale === '') {
            return null;
        }

        $normalized = str_replace('_', '-', trim($locale));

        if (str_starts_with($normalized, 'pt')) {
            return 'pt-BR';
        }

        if (str_starts_with($normalized, 'en')) {
            return 'en-US';
        }

        if (str_starts_with($normalized, 'es')) {
            return 'es-ES';
        }

        return in_array($normalized, self::SUPPORTED_LOCALES, true) ? $normalized : null;
    }
}
