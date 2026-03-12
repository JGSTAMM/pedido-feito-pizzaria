<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$updated = \App\Models\Order::where('status', 'paid')->update(['status' => 'completed']);
echo "Updated $updated orders from paid to completed.";
