<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\PizzaFlavor;
use App\Models\OrderItem;

class FixUtf8Encoding extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:fix-utf8';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix Mojibake (corrupted UTF-8) characters in database text fields';

    /**
     * The mapping of corrupted characters to correct characters.
     */
    protected $replaceMap = [
        // Uppercase
        'Ã€' => 'À', 'Ã ' => 'À', 'Ã‚' => 'Â', 'Ãƒ' => 'Ã', 'Ã„' => 'Ä',
        'Ã‡' => 'Ç',
        'Ãˆ' => 'È', 'Ã‰' => 'É', 'ÃŠ' => 'Ê', 'Ã‹' => 'Ë',
        'ÃŒ' => 'Ì', 'Ã ' => 'Í', 'ÃŽ' => 'Î', 'Ã ' => 'Ï', // Note: 'Ã ' is often Í depending on the dump
        'Ã’' => 'Ò', 'Ã“' => 'Ó', 'Ã”' => 'Ô', 'Ã•' => 'Õ', 'Ã–' => 'Ö',
        'Ã™' => 'Ù', 'Ãš' => 'Ú', 'Ã›' => 'Û', 'Ãœ' => 'Ü',
        
        // Lowercase
        'Ã¡' => 'á', 'Ã¢' => 'â', 'Ã£' => 'ã', 'Ã¤' => 'ä', 'Ã ' => 'à',
        'Ã§' => 'ç',
        'Ã¨' => 'è', 'Ã©' => 'é', 'Ãª' => 'ê', 'Ã«' => 'ë',
        'Ã¬' => 'ì', 'Ã­' => 'í', 'Ã®' => 'î', 'Ã¯' => 'ï',
        'Ã²' => 'ò', 'Ã³' => 'ó', 'Ã´' => 'ô', 'Ãµ' => 'õ', 'Ã¶' => 'ö',
        'Ã¹' => 'ù', 'Ãº' => 'ú', 'Ã»' => 'û', 'Ã¼' => 'ü',
        
        // Special case fallbacks from user prompt if exact match is needed
        // The user mentioned 'Ã' -> 'í', 'Ã ' -> 'À', 'Ã' -> 'Í'. We must be careful not to replace 'Ã' too early.
        // It's better to rely on standard utf-8 mojibake replacements as above.
    ];

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Starting UTF-8 Mojibake correction...');

        $this->fixProducts();
        $this->fixPizzaFlavors();
        $this->fixOrderItems();

        $this->info('Finished UTF-8 Mojibake correction successfully.');
        
        return 0;
    }

    private function applyFix(?string $text): ?string
    {
        if (empty($text)) {
            return $text;
        }
        
        return str_replace(array_keys($this->replaceMap), array_values($this->replaceMap), $text);
    }

    private function fixProducts()
    {
        $this->info('Fixing Products...');
        $products = Product::all();
        $count = 0;

        foreach ($products as $product) {
            $changed = false;

            $newName = $this->applyFix($product->name);
            if ($newName !== $product->name) {
                $product->name = $newName;
                $changed = true;
            }

            $newDesc = $this->applyFix($product->description);
            if ($newDesc !== $product->description) {
                $product->description = $newDesc;
                $changed = true;
            }

            $newCat = $this->applyFix($product->category);
            if ($newCat !== $product->category) {
                $product->category = $newCat;
                $changed = true;
            }

            // Fix variations if they exist
            $variations = $product->variations;
            if (is_array($variations)) {
                $variationsChanged = false;
                foreach ($variations as $i => $variation) {
                    if (isset($variation['name'])) {
                        $newVarName = $this->applyFix($variation['name']);
                        if ($newVarName !== $variation['name']) {
                            $variations[$i]['name'] = $newVarName;
                            $variationsChanged = true;
                        }
                    }
                }
                if ($variationsChanged) {
                    $product->variations = $variations;
                    $changed = true;
                }
            }

            if ($changed) {
                $product->save();
                $count++;
            }
        }

        $this->info("Updated {$count} Products.");
    }

    private function fixPizzaFlavors()
    {
        $this->info('Fixing PizzaFlavors...');
        $flavors = PizzaFlavor::all();
        $count = 0;

        foreach ($flavors as $flavor) {
            $changed = false;

            $newName = $this->applyFix($flavor->name);
            if ($newName !== $flavor->name) {
                $flavor->name = $newName;
                $changed = true;
            }

            $newDesc = $this->applyFix($flavor->description);
            if ($newDesc !== $flavor->description) {
                $flavor->description = $newDesc;
                $changed = true;
            }

            $newIng = $this->applyFix($flavor->ingredients);
            if ($newIng !== $flavor->ingredients) {
                $flavor->ingredients = $newIng;
                $changed = true;
            }

            $newCat = $this->applyFix($flavor->flavor_category);
            if ($newCat !== $flavor->flavor_category) {
                $flavor->flavor_category = $newCat;
                $changed = true;
            }

            if ($changed) {
                $flavor->save();
                $count++;
            }
        }

        $this->info("Updated {$count} PizzaFlavors.");
    }

    private function fixOrderItems()
    {
        $this->info('Fixing OrderItems...');
        $items = OrderItem::all();
        $count = 0;

        foreach ($items as $item) {
            $changed = false;

            $newNotes = $this->applyFix($item->notes);
            if ($newNotes !== $item->notes) {
                $item->notes = $newNotes;
                $changed = true;
            }

            $newDesc = $this->applyFix($item->description);
            if ($newDesc !== $item->description) {
                $item->description = $newDesc;
                $changed = true;
            }

            if ($changed) {
                $item->save();
                $count++;
            }
        }

        $this->info("Updated {$count} OrderItems.");
    }
}
