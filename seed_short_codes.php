<?php
use App\Models\Order;
use Illuminate\Support\Str;

$orders = Order::whereNull('short_code')->get();
foreach ($orders as $order) {
    do {
        $code = strtoupper(Str::random(5));
    } while (Order::where('short_code', $code)->exists());
    $order->short_code = $code;
    $order->save();
    echo "Generated short code $code for order {$order->id}\n";
}
echo "Done.\n";
