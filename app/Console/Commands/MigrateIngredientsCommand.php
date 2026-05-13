<?php

namespace App\Console\Commands;

use App\Models\PizzaFlavor;
use Illuminate\Console\Command;

class MigrateIngredientsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-ingredients {--force : Re-migrate even if ingredients_json is already populated}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate ingredients_json from the legacy ingredients string with robust splitting and base ingredients';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $flavors = PizzaFlavor::all();
        $count = 0;
        $force = $this->option('force');

        $this->info('Starting migration of ingredients to JSON format...');

        foreach ($flavors as $flavor) {
            // Only migrate if json is empty OR force flag is set
            if ((empty($flavor->ingredients_json) || $force) && !empty($flavor->ingredients)) {
                
                // Identify if savory (copying logic from menuHelpers.js)
                $cat = strtolower($flavor->flavor_category ?? '');
                $name = strtolower($flavor->name ?? '');
                $isSavory = empty($cat) || in_array($cat, ['salgada', 'tradicional', 'especial']);
                $isForceSweet = str_contains($name, 'doce') || str_contains($name, 'chocolate');
                
                // Split by comma, " e ", or pipe
                // Using regex to handle " e " as a separator but preserving case-insensitivity
                $parts = preg_split('/(?:,|\s+e\s+|\|)+/i', $flavor->ingredients);
                
                $ingredientNames = [];
                
                // Prepend base ingredients if savory
                if ($isSavory && !$isForceSweet) {
                    $ingredientNames[] = 'Molho artesanal';
                    $ingredientNames[] = 'Queijo mussarela ralado';
                }

                foreach ($parts as $part) {
                    $ingName = trim($part);
                    if (!empty($ingName)) {
                        // Avoid duplicates (especially if base ingredients were already in the string)
                        $normalized = mb_strtolower($ingName);
                        $alreadyExists = false;
                        foreach ($ingredientNames as $existing) {
                            if (mb_strtolower($existing) === $normalized) {
                                $alreadyExists = true;
                                break;
                            }
                        }
                        
                        if (!$alreadyExists) {
                            $ingredientNames[] = $ingName;
                        }
                    }
                }

                $json = array_map(function($name) {
                    return [
                        'name' => $name,
                        'is_available' => true
                    ];
                }, $ingredientNames);

                if (!empty($json)) {
                    $flavor->ingredients_json = $json;
                    $flavor->save();
                    $count++;
                    $this->line("Migrated: {$flavor->name} (" . count($json) . " ingredients)");
                }
            }
        }

        $this->info("Migration completed! {$count} flavors updated.");
    }
}
