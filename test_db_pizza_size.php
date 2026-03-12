<?php
$size = App\Models\PizzaSize::first();
$out = "PizzaSize ID: " . $size->id . "\n";
$out .= "PizzaSize ID type: " . gettype($size->id) . "\n";

$item = App\Models\OrderItem::whereNotNull('pizza_size_id')->first();
if ($item) {
    $out .= "OrderItem with pizza_size_id found!\n";
    $out .= "ID: " . $item->pizza_size_id . "\n";
} else {
    $out .= "No OrderItem with pizza_size_id found.\n";
}

$lastItem = App\Models\OrderItem::latest()->first();
$out .= "Last OrderItem details:\n";
$out .= json_encode($lastItem->toArray(), JSON_PRETTY_PRINT) . "\n";

file_put_contents('out.txt', $out);
echo "Wrote to out.txt\n";
