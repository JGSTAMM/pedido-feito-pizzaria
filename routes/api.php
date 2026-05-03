<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerIdentityController;
use App\Http\Controllers\Api\DataController;
use App\Http\Controllers\Api\DigitalMenuController;
use App\Http\Controllers\Api\OnlinePaymentController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;

use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;

// ═══════════════════════════════════════════
// ROTAS PÚBLICAS (com rate limiting)
// ═══════════════════════════════════════════

Route::middleware(['throttle:60,1', EncryptCookies::class, AddQueuedCookiesToResponse::class, StartSession::class])->group(function () {
    Route::get('/digital-menu', [DigitalMenuController::class, 'index']);
    Route::post('/customers/identify', [CustomerIdentityController::class, 'identify']);
});

// Payment status polling — relaxed throttle to prevent 429 on 5-second intervals
Route::middleware(['throttle:120,1', EncryptCookies::class, AddQueuedCookiesToResponse::class, StartSession::class])->group(function () {
    Route::get('/orders/{order}/payment-status', [OnlinePaymentController::class, 'paymentStatus']);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Online Payment (público — o cliente faz o pedido sem login)
Route::post('/online-orders', [OnlinePaymentController::class, 'store'])
    ->middleware(['throttle:10,1', EncryptCookies::class, AddQueuedCookiesToResponse::class, StartSession::class]);

Route::post('/payments/webhook', [OnlinePaymentController::class, 'webhook'])
    ->middleware('throttle:60,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::middleware('role:admin,cashier,caixa,waiter,garcom')->group(function () {
        Route::get('/sync', [DataController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/tables/{table}/orders', [OrderController::class, 'getByTable']);
        Route::get('/orders/active', [OrderController::class, 'getAllActive']);
        Route::get('/orders/ready', [OrderController::class, 'getReady']);
        Route::post('/tables/{table}/pay', [OrderController::class, 'payAndCloseTable'])
            ->middleware('can:payAndClose,table');
    });

    Route::middleware('role:admin,cashier,caixa')->group(function () {
        Route::post('/tables/{table}/close', [OrderController::class, 'closeTable'])
            ->middleware('can:closeWithoutPayment,table');
    });
});
