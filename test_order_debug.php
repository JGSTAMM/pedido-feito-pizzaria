<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = \App\Models\Table::with('activeOrders.payments')->get();
foreach($tables as $t) {
    if (count($t->activeOrders) > 0) {
        echo "Table: " . $t->name . " (Status: " . $t->status . ")\n";
        foreach($t->activeOrders as $o) {
            echo "  Order ID: " . $o->id . " | Total: " . $o->total_amount . " | Status: " . $o->status . "\n";
            $paid = $o->payments->sum('amount');
            echo "  Order Payments Sum: " . $paid . "\n";
        }
    } else {
        echo "Table: " . $t->name . " (Status: " . $t->status . ") - No Active Orders\n";
    }
}
