<?php
// Temporary diagnostic script - safe to delete
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$s = \App\Models\StoreSetting::first();
echo "=== StoreSetting DB Fields ===" . PHP_EOL;
echo "logo_image: " . ($s->logo_image ?? 'NULL') . PHP_EOL;
echo "cover_image: " . ($s->cover_image ?? 'NULL') . PHP_EOL;
echo "story_media (raw): " . $s->getRawOriginal('story_media') . PHP_EOL;
echo PHP_EOL;

echo "=== Computed URLs ===" . PHP_EOL;
echo "logo_url: " . ($s->logo_url ?? 'NULL') . PHP_EOL;
echo "cover_url: " . ($s->cover_url ?? 'NULL') . PHP_EOL;
echo "story_media (accessor): " . json_encode($s->story_media) . PHP_EOL;
echo PHP_EOL;

// Check if files actually exist on disk
echo "=== File Existence Check ===" . PHP_EOL;
if ($s->logo_image) {
    echo "logo_image file exists: " . (file_exists(storage_path('app/public/' . $s->logo_image)) ? 'YES' : 'NO') . PHP_EOL;
} else {
    echo "logo_image: FIELD IS NULL" . PHP_EOL;
}
if ($s->cover_image) {
    echo "cover_image file exists: " . (file_exists(storage_path('app/public/' . $s->cover_image)) ? 'YES' : 'NO') . PHP_EOL;
} else {
    echo "cover_image: FIELD IS NULL" . PHP_EOL;
}

// Check PizzaFlavor images
echo PHP_EOL . "=== PizzaFlavor Images ===" . PHP_EOL;
$flavors = \App\Models\PizzaFlavor::all();
foreach ($flavors as $f) {
    $imgStatus = 'NULL';
    if ($f->image) {
        $exists = file_exists(storage_path('app/public/' . $f->image));
        $imgStatus = $f->image . " (exists: " . ($exists ? 'YES' : 'NO') . ")";
    }
    echo $f->name . " => " . $imgStatus . PHP_EOL;
}
