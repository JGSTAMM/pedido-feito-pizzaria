$user = App\Models\User::where('email', 'admin@lucchese.com')->first();
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
    'customer_name' => 'Pizza Tester',
    'payment_method' => 'dinheiro'
]);

Auth::login($user);

try {
    app(App\Http\Controllers\PosController::class)->store(app('request'));
    echo "\n===> SUCCESS! POS controller processed without exceptions.\n";
    $order = App\Models\Order::latest()->first();
    echo "Order saved! ID: " . $order->id . " | Total: " . $order->total_amount . "\n";
    echo "Items count: " . $order->items->count() . "\n";
    $item = $order->items->first();
    echo "Pizza Size: " . $item->pizzaSize->name . "\n";
    echo "Pizza Flavors: " . $item->flavors->pluck('name')->join(', ') . "\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "\n===> VALIDATION ERROR:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "\n===> OTHER ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
