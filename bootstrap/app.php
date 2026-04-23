<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);

        $middleware->encryptCookies(except: [
            'customer_phone',
        ]);

        $middleware->web(
            prepend: [
                \App\Http\Middleware\SetRequestLocale::class,
            ],
            append: [
                \App\Http\Middleware\HandleInertiaRequests::class,
            ],
        );
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $exception, Request $request) {
            if (! $request->expectsJson() && ! $request->is('api/*')) {
                return null;
            }

            if (config('app.debug')) {
                return null;
            }

            $statusCode = $exception instanceof HttpExceptionInterface
                ? $exception->getStatusCode()
                : 500;

            $statusCode = ($statusCode >= 400 && $statusCode <= 599) ? $statusCode : 500;

            Log::error('Unhandled API exception', [
                'message' => $exception->getMessage(),
                'exception' => get_class($exception),
                'trace' => $exception->getTraceAsString(),
                'path' => $request->path(),
                'method' => $request->method(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('common.error.unexpected'),
                'error_code' => 'UNEXPECTED_ERROR',
            ], $statusCode);
        });
    })->create();
