<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        $host = $request->getHost();
        $scheme = $request->getScheme();
        $wsScheme = $request->isSecure() ? 'wss' : 'ws';

        $isLocal = app()->environment('local', 'testing') && (
            in_array($host, ['localhost', '127.0.0.1'], true)
            || preg_match('/^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/', $host) === 1
        );

        $viteHttp = $isLocal ? " {$scheme}://{$host}:5173 http://localhost:5173" : '';
        $localWs = $isLocal ? " {$wsScheme}://{$host}:5173 ws://localhost:5173 {$wsScheme}://{$host}:8080 ws://localhost:8080" : '';

        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self' data: blob:{$viteHttp}; "
            . "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com{$viteHttp}; "
            . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com{$viteHttp}; "
            . "font-src 'self' https://fonts.gstatic.com data:; "
            . "img-src 'self' data: https: blob:; "
            . "frame-src 'self' https://www.google.com https://*.google.com https://*.mercadopago.com https://*.mercadolivre.com https://*.mercadolibre.com; "
            . "connect-src 'self' ws: wss: https:{$viteHttp}{$localWs};"
        );

        return $response;
    }
}
