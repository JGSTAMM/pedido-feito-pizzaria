<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = \App\Models\Table::with('orders')->get();
foreach ($tables as $t) {
    echo "Table: {$t->name} (Status: {$t->status})\n";
    foreach ($t->orders as $o) {
        $total = $o->total_amount;
        echo "  - Order: {$o->id} (Status: {$o->status}) - Total: {$total}\n";
    }
}
