<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerMenuController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FlavorController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\KdsController;
use App\Http\Controllers\NeighborhoodController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SizeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WaiterController;
use App\Models\Order;
use Illuminate\Support\Facades\Cookie;
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
        ->withCookie(Cookie::forget('menu_locale_selected'))
        ->withCookie(Cookie::forget('app_locale'));
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
        Route::post('/pos/generate-pix', [PosController::class, 'generatePix'])
            ->middleware('throttle:20,1');
        Route::get('/pos/pix-status/{gatewayPaymentId}', [PosController::class, 'pixPaymentStatus']);
        Route::get('/api/customers/search', [CustomerController::class, 'search']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/export', [ReportController::class, 'export']);

        Route::get('/cash-register', [CashRegisterController::class, 'index']);
        Route::post('/cash-register/open', [CashRegisterController::class, 'open']);
        Route::post('/cash-register/close', [CashRegisterController::class, 'close'])
            ->middleware('can:closeCashRegister,'.Order::class);

        Route::resource('/users', UserController::class)->except(['create', 'show', 'edit']);
        Route::resource('/expenses', App\Http\Controllers\ExpenseController::class)->except(['create', 'show', 'edit']);

        Route::get('/products', [ProductController::class, 'index'])->name('products');
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::patch('/products/{product}/toggle-status', [ProductController::class, 'toggleStatus']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        Route::get('/flavors', [FlavorController::class, 'index'])->name('flavors');
        Route::post('/flavors', [FlavorController::class, 'store']);
        Route::put('/flavors/{flavor}', [FlavorController::class, 'update']);
        Route::patch('/flavors/{flavor}/toggle-status', [FlavorController::class, 'toggleStatus']);
        Route::delete('/flavors/{flavor}', [FlavorController::class, 'destroy']);

        Route::get('/sizes', [SizeController::class, 'index'])->name('sizes');
        Route::post('/sizes', [SizeController::class, 'store']);
        Route::put('/sizes/{size}', [SizeController::class, 'update']);
        Route::delete('/sizes/{size}', [SizeController::class, 'destroy']);

        Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
        Route::post('/settings/status', [SettingsController::class, 'updateStoreStatus']);
        Route::post('/settings/hours', [SettingsController::class, 'updateOpeningHours']);
        Route::post('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::post('/settings/branding', [SettingsController::class, 'updateBranding']);
        Route::post('/settings/receipt', [SettingsController::class, 'updateReceipt']);
        Route::post('/settings/integrations', [SettingsController::class, 'updateIntegrations']);
        Route::post('/settings/printers', [SettingsController::class, 'storePrinter']);
        Route::put('/settings/printers/{printer}', [SettingsController::class, 'updatePrinter']);
        Route::delete('/settings/printers/{printer}', [SettingsController::class, 'destroyPrinter']);
        Route::post('/settings/printers/test-agent', [SettingsController::class, 'testPrint']);
        Route::post('/settings/printers/regenerate-token', [SettingsController::class, 'regenerateAgentToken']);

        Route::resource('/neighborhoods', NeighborhoodController::class)->except(['create', 'show', 'edit']);
    });

    Route::middleware('role:admin,cashier,caixa,waiter,garcom')->group(function () {
        Route::get('/kds', [KdsController::class, 'index']);
        Route::post('/kds/{order}/status/{status}', [KdsController::class, 'updateStatus']);
        Route::post('/kds/{order}/print', [KdsController::class, 'reprint']);
        Route::get('/kds/print-agent-status', [KdsController::class, 'agentStatus']);
        Route::get('/floor', [FloorController::class, 'index']);
        Route::post('/floor/{table}/add-items', [FloorController::class, 'addItems']);
        Route::post('/floor/validate-supervisor-pin', [FloorController::class, 'validateSupervisorPin'])
            ->middleware('throttle:5,1');
        Route::post('/floor/{table}/pay', [FloorController::class, 'payAndClose']);
        Route::post('/floor/{table}/print-bill', [FloorController::class, 'printBill']);
        Route::post('/floor/{table}/generate-pix', [FloorController::class, 'generatePix']);
        Route::get('/floor/pix-status/{order}', [FloorController::class, 'pixPaymentStatus']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('/floor', [FloorController::class, 'store']);
        Route::put('/floor/{table}', [FloorController::class, 'update']);
        Route::delete('/floor/{table}', [FloorController::class, 'destroy']);
        Route::post('/settings/supervisor-pin', [SettingsController::class, 'updateSupervisorPin'])
            ->name('settings.supervisor-pin.update');
        Route::delete('/settings/supervisor-pin/{user}', [SettingsController::class, 'clearSupervisorPin'])
            ->name('settings.supervisor-pin.destroy');
    });

    Route::middleware('role:waiter,garcom')->group(function () {
        Route::get('/waiter', [WaiterController::class, 'index']);
        Route::get('/waiter/orders', [WaiterController::class, 'orders']);
        Route::get('/waiter/profile', [WaiterController::class, 'profile']);
    });
});
