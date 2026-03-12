$user = App\Models\User::where('email', 'admin@lucchese.com')->first();
Auth::login($user);
$product = App\Models\Product::first();

app('request')->merge([
    'items' => [
        [
            'id' => $product->id,
            'type' => 'product',
            'quantity' => 1,
            'price' => $product->price,
        ]
    ],
    'customer_name' => 'Teste DB',
    'payment_method' => 'dinheiro'
]);

try {
    app(App\Http\Controllers\PosController::class)->store(app('request'));
    echo "Success!\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation Error:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "Other Error: " . $e->getMessage() . "\n";
}
