<?php

use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerMenuController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\KdsController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\WaiterController;
use App\Http\Controllers\AuthController;
use App\Models\Order;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::redirect('/admin', '/dashboard');

Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::get('/menu', [CustomerMenuController::class, 'index'])->name('customer-menu.index');
Route::get('/menu/reset-locale', function () {
    return redirect('/menu')
        ->withCookie(\Illuminate\Support\Facades\Cookie::forget('menu_locale_selected'))
        ->withCookie(\Illuminate\Support\Facades\Cookie::forget('app_locale'));
})->name('customer-menu.reset-locale');
Route::get('/menu/checkout', [CustomerMenuController::class, 'checkout'])->name('customer-menu.checkout');
Route::get('/menu/orders', [CustomerMenuController::class, 'orders'])->name('customer-menu.orders');
Route::get('/menu/cart', [CustomerMenuController::class, 'cart'])->name('customer-menu.cart');
Route::get('/menu/store-profile', [CustomerMenuController::class, 'storeProfile'])->name('customer-menu.store-profile');
Route::get('/menu/order/{order}/status', [CustomerMenuController::class, 'status'])->name('customer-menu.status');

// ── React/Inertia Tenant Routes ──
Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::middleware('role:admin,cashier,caixa')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/pos', [PosController::class, 'index']);
        Route::post('/pos/order', [PosController::class, 'store']);
        Route::get('/api/customers/search', [CustomerController::class, 'search']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);

        Route::get('/cash-register', [CashRegisterController::class, 'index']);
        Route::post('/cash-register/open', [CashRegisterController::class, 'open']);
        Route::post('/cash-register/close', [CashRegisterController::class, 'close'])
            ->middleware('can:closeCashRegister,'.Order::class);

        Route::resource('/users', \App\Http\Controllers\UserController::class)->except(['create', 'show', 'edit']);

        Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products');
        Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
        Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update']);
        Route::patch('/products/{product}/toggle-status', [\App\Http\Controllers\ProductController::class, 'toggleStatus']);
        Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy']);

        Route::get('/flavors', [\App\Http\Controllers\FlavorController::class, 'index'])->name('flavors');
        Route::post('/flavors', [\App\Http\Controllers\FlavorController::class, 'store']);
        Route::put('/flavors/{flavor}', [\App\Http\Controllers\FlavorController::class, 'update']);
        Route::patch('/flavors/{flavor}/toggle-status', [\App\Http\Controllers\FlavorController::class, 'toggleStatus']);
        Route::delete('/flavors/{flavor}', [\App\Http\Controllers\FlavorController::class, 'destroy']);

        Route::get('/sizes', [\App\Http\Controllers\SizeController::class, 'index'])->name('sizes');
        Route::post('/sizes', [\App\Http\Controllers\SizeController::class, 'store']);
        Route::put('/sizes/{size}', [\App\Http\Controllers\SizeController::class, 'update']);
        Route::delete('/sizes/{size}', [\App\Http\Controllers\SizeController::class, 'destroy']);

        Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings');
        Route::post('/settings/status', [\App\Http\Controllers\SettingsController::class, 'updateStoreStatus']);
        Route::post('/settings/hours', [\App\Http\Controllers\SettingsController::class, 'updateOpeningHours']);
        Route::post('/settings/profile', [\App\Http\Controllers\SettingsController::class, 'updateProfile']);
        Route::post('/settings/branding', [\App\Http\Controllers\SettingsController::class, 'updateBranding']);
        Route::post('/settings/receipt', [\App\Http\Controllers\SettingsController::class, 'updateReceipt']);
        Route::post('/settings/printers', [\App\Http\Controllers\SettingsController::class, 'storePrinter']);
        Route::put('/settings/printers/{printer}', [\App\Http\Controllers\SettingsController::class, 'updatePrinter']);
        Route::delete('/settings/printers/{printer}', [\App\Http\Controllers\SettingsController::class, 'destroyPrinter']);
        
        Route::resource('/neighborhoods', \App\Http\Controllers\NeighborhoodController::class)->except(['create', 'show', 'edit']);
    });

    Route::middleware('role:admin,cashier,caixa,waiter,garcom')->group(function () {
        Route::get('/kds', [KdsController::class, 'index']);
        Route::post('/kds/{order}/status/{status}', [KdsController::class, 'updateStatus']);
        Route::get('/floor', [FloorController::class, 'index']);
        Route::post('/floor', [FloorController::class, 'store']);
        Route::post('/floor/{table}/add-items', [FloorController::class, 'addItems']);
        Route::post('/floor/{table}/pay', [FloorController::class, 'payAndClose']);
        Route::put('/floor/{table}', [FloorController::class, 'update']);
        Route::delete('/floor/{table}', [FloorController::class, 'destroy']);
    });

    Route::middleware('role:waiter,garcom')->group(function () {
        Route::get('/waiter', [WaiterController::class, 'index']);
        Route::get('/waiter/orders', [WaiterController::class, 'orders']);
        Route::get('/waiter/profile', [WaiterController::class, 'profile']);
    });
});
