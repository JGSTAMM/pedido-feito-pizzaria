<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = App\Models\User::where('email', 'admin@lucchese.com')->first();
$product = App\Models\Product::first();

$request = Illuminate\Http\Request::create('/pos/order', 'POST', [
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

// Start session to capture flash errors
$request->setLaravelSession($app['session']->driver());
$request->session()->start();

$app['auth']->guard()->setUser($user);

$response = $kernel->handle($request);
if ($response->isRedirection()) {
    $session = $request->session();
    if ($session->has('errors')) {
        print_r($session->get('errors')->getBag('default')->getMessages());
    } else {
        echo "Redirected without validation errors. To: " . $response->getTargetUrl() . "\n";
        if ($session->has('error')) {
            echo "Flash error: " . $session->get('error');
        }
    }
} else {
    echo "Status: " . $response->getStatusCode() . "\n";
    echo substr($response->getContent(), 0, 500);
}
