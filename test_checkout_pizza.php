<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = App\Models\User::where('email', 'admin@lucchese.com')->first();
$size = App\Models\PizzaSize::first();
$flavor = App\Models\PizzaFlavor::first();

$request = Illuminate\Http\Request::create('/pos/order', 'POST', [
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
    'customer_name' => 'Cliente Script Test',
    'payment_method' => 'dinheiro'
]);

$request->setLaravelSession($app['session']->driver());
$request->session()->start();
$app['auth']->guard()->setUser($user);

$response = $kernel->handle($request);
if ($response->isRedirection()) {
    $session = $request->session();
    if ($session->has('errors')) {
        echo "VALIDATION FAILED:\n";
        print_r($session->get('errors')->getBag('default')->getMessages());
    } else {
        echo "SUCCESS! Redirected to: " . $response->getTargetUrl() . "\n";
        if ($session->has('success')) echo "Flash: " . $session->get('success') . "\n";
        if ($session->has('error')) echo "Flash Error: " . $session->get('error') . "\n";
        
        $order = App\Models\Order::latest()->first();
        echo "Order saved! ID: " . $order->id . " | Total: " . $order->total_amount . "\n";
        echo "Items count: " . $order->items->count() . "\n";
    }
} else {
    echo "Status: " . $response->getStatusCode() . "\n";
    echo substr($response->getContent(), 0, 500);
}
