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
    protected $signature = 'app:migrate-ingredients';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate ingredients_json from the legacy ingredients string';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $flavors = PizzaFlavor::all();
        $count = 0;

        $this->info('Starting migration of ingredients to JSON format...');

        foreach ($flavors as $flavor) {
            // Only migrate if json is empty and legacy string is not
            if (empty($flavor->ingredients_json) && !empty($flavor->ingredients)) {
                // Split by comma or pipe
                $parts = preg_split('/[,|]+/', $flavor->ingredients);
                $json = [];
                
                foreach ($parts as $part) {
                    $name = trim($part);
                    if (!empty($name)) {
                        $json[] = [
                            'name' => $name,
                            'is_available' => true
                        ];
                    }
                }

                if (!empty($json)) {
                    $flavor->ingredients_json = $json;
                    $flavor->save();
                    $count++;
                    $this->line("Migrated: {$flavor->name}");
                }
            }
        }

        $this->info("Migration completed! {$count} flavors updated.");
    }
}
