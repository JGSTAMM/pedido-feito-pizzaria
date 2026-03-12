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
    'customer_name' => 'Pizza Tester Final 3',
    'payment_method' => 'dinheiro'
]);

$sessionDriver = app('session')->driver();
$sessionDriver->start();
app('request')->setLaravelSession($sessionDriver);

try {
    $response = app(App\Http\Controllers\PosController::class)->store(app('request'));
    if ($response instanceof \Illuminate\Http\RedirectResponse) {
        $url = $response->getTargetUrl();
        file_put_contents('debug.txt', "REDIRECT URL: $url");
        $session = $sessionDriver->all();
        file_put_contents('debug.json', json_encode($session, JSON_PRETTY_PRINT));
        echo "Check debug.txt and debug.json\n";
    } else {
        echo "Not a redirect.\n";
    }
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "VALIDATION ERROR:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
