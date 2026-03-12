<?php
$user = App\Models\User::where('email', 'admin@lucchese.com')->first();
Auth::login($user);

// Open a cash register for the user
$register = App\Models\CashRegister::firstOrCreate(
    ['user_id' => $user->id, 'status' => 'open'],
    ['opening_balance' => 100, 'opened_at' => now()]
);

$size = App\Models\PizzaSize::first();
$flavor = App\Models\PizzaFlavor::first();

app('request')->merge([
    'items' => [
        [
            'id' => \Illuminate\Support\Str::uuid()->toString(),
            'type' => 'pizza_custom',
            'quantity' => 1,
            'price' => $flavor->base_price,
            'size_id' => $size->id,
            'flavor_ids' => [$flavor->id],
            'border_id' => null,
            'observation' => 'Sem cebola',
        ]
    ],
    'customer_name' => 'Pizza Tester Final 2',
    'payment_method' => 'dinheiro'
]);

// Start session
$sessionDriver = app('session')->driver();
$sessionDriver->start();
app('request')->setLaravelSession($sessionDriver);

try {
    $response = app(App\Http\Controllers\PosController::class)->store(app('request'));
    echo "Controller returned type: " . get_class($response) . "\n";
    if ($response instanceof \Illuminate\Http\RedirectResponse) {
        echo "REDIRECT URL: " . $response->getTargetUrl() . "\n";
        if ($sessionDriver->has('error')) echo "FLASH ERROR: " . $sessionDriver->get('error') . "\n";
        if ($sessionDriver->has('success')) echo "FLASH SUCCESS: " . $sessionDriver->get('success') . "\n";
    }
    
    $customItems = App\Models\OrderItem::where('type', 'pizza_custom')->count();
    $lastOrder = App\Models\Order::latest()->first();
    echo "Custom pizza items in DB: " . $customItems . "\n";
    echo "Last Order customer: " . $lastOrder->customer_name . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "VALIDATION ERROR:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
