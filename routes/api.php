<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DataController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\DigitalMenuController;
use App\Http\Controllers\Api\OnlinePaymentController;

// ═══════════════════════════════════════════
// ROTAS PÚBLICAS (sem autenticação)
// ═══════════════════════════════════════════
Route::get('/digital-menu', [DigitalMenuController::class, 'index']);

Route::post('/login', [AuthController::class, 'login']);

// Online Payment (público — o cliente faz o pedido sem login)
Route::post('/online-orders', [OnlinePaymentController::class, 'store']);
Route::post('/payments/webhook', [OnlinePaymentController::class, 'webhook']);
Route::get('/orders/{order}/payment-status', [OnlinePaymentController::class, 'paymentStatus']);

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
