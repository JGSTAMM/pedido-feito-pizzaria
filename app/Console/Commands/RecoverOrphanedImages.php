<?php

namespace App\Console\Commands;

use App\Models\PizzaFlavor;
use App\Models\StoreSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class RecoverOrphanedImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:recover {--force : Actually execute database updates and file deletions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recover orphaned pizza flavor images and clean up unused branding assets';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');

        if (!$force) {
            $this->info('========================================================');
            $this->info('  DRY-RUN MODE: No changes will be written to disk/DB.  ');
            $this->info('  Run with --force to execute the recovery and cleanup. ');
            $this->info('========================================================');
            $this->line('');
        }

        // --- 1. RECOVER PIZZA FLAVOR IMAGE ---
        $this->comment('--- 1. Pizza Flavor Image Recovery ---');
        $flavor = PizzaFlavor::where('name', 'Camarão ao 4 Queijos')->first();

        if (!$flavor) {
            $this->error('Pizza flavor "Camarão ao 4 Queijos" not found in database!');
        } else {
            $targetImage = 'flavors/fHJY8AfMqWg0EU0SWvSMyLqdmsv70J5gaNm2b6P0.jpg';
            $currentImage = $flavor->getRawOriginal('image');

            if ($currentImage === $targetImage) {
                $this->info('Pizza flavor "Camarão ao 4 Queijos" is already linked to the target image.');
            } else {
                $this->warn("Pizza flavor \"Camarão ao 4 Queijos\" is currently linked to: \"{$currentImage}\"");
                $this->info("Will link to: \"{$targetImage}\"");

                if ($force) {
                    $flavor->image = $targetImage;
                    $flavor->save();
                    $this->info('Successfully updated PizzaFlavor in database.');
                }
            }
        }
        $this->line('');

        // --- 2. AUDIT FLAVORS DIRECTORY ---
        $this->comment('--- 2. Pizza Flavors Directory Audit ---');
        
        // Fetch all current database image paths for pizza flavors
        // If not in force mode, we simulate the update for "Camarão ao 4 Queijos" in our audit
        $activeFlavorImages = PizzaFlavor::whereNotNull('image')
            ->pluck('image')
            ->map(fn($path) => str_replace('flavors/', '', $path))
            ->toArray();

        if (!$force && $flavor && !in_array('fHJY8AfMqWg0EU0SWvSMyLqdmsv70J5gaNm2b6P0.jpg', $activeFlavorImages)) {
            $activeFlavorImages[] = 'fHJY8AfMqWg0EU0SWvSMyLqdmsv70J5gaNm2b6P0.jpg';
            // If the old one yF81IbXw... was in there, we simulate it being orphaned
            if (($key = array_search('yF81IbXwxF4fVm1Q9jsbh5O9IsM9svQVkVPKtO1E.jpg', $activeFlavorImages)) !== false) {
                unset($activeFlavorImages[$key]);
            }
        }

        $allFlavorFiles = Storage::disk('public')->files('flavors');
        $orphanedFlavorFiles = [];

        foreach ($allFlavorFiles as $file) {
            $filename = basename($file);
            if (!in_array($filename, $activeFlavorImages)) {
                $orphanedFlavorFiles[] = $file;
            }
        }

        if (empty($orphanedFlavorFiles)) {
            $this->info('No orphaned pizza flavor images found.');
        } else {
            $this->warn('Found ' . count($orphanedFlavorFiles) . ' orphaned pizza flavor file(s):');
            foreach ($orphanedFlavorFiles as $file) {
                $size = round(Storage::disk('public')->size($file) / 1024 / 1024, 2);
                $this->line(" - {$file} ({$size} MB)");
            }

            if ($force) {
                $this->comment('Deleting orphaned pizza flavor files...');
                foreach ($orphanedFlavorFiles as $file) {
                    Storage::disk('public')->delete($file);
                    $this->info("Deleted: {$file}");
                }
            }
        }
        $this->line('');

        // --- 3. AUDIT BRANDING DIRECTORY ---
        $this->comment('--- 3. Store Branding Directory Audit ---');
        $setting = StoreSetting::first();

        if (!$setting) {
            $this->error('No StoreSetting record found in database!');
        } else {
            // Retrieve raw active branding fields to avoid domain prefixes from accessors
            $activeBranding = [];
            
            if ($logo = $setting->getRawOriginal('logo_image')) {
                $activeBranding[] = basename($logo);
            }
            if ($cover = $setting->getRawOriginal('cover_image')) {
                $activeBranding[] = basename($cover);
            }

            // Decode story_media directly from raw database value
            $rawStories = $setting->getRawOriginal('story_media');
            if ($rawStories) {
                $stories = json_decode($rawStories, true);
                if (is_array($stories)) {
                    foreach ($stories as $story) {
                        if (isset($story['url'])) {
                            // Extract path/filename
                            $path = parse_url($story['url'], PHP_URL_PATH);
                            $activeBranding[] = basename($path);
                        }
                    }
                }
            }

            $this->info('Active branding files registered in database:');
            foreach ($activeBranding as $activeFile) {
                $this->line(" - {$activeFile}");
            }
            $this->line('');

            $allBrandingFiles = Storage::disk('public')->files('branding');
            $orphanedBrandingFiles = [];

            foreach ($allBrandingFiles as $file) {
                $filename = basename($file);
                if (!in_array($filename, $activeBranding)) {
                    $orphanedBrandingFiles[] = $file;
                }
            }

            if (empty($orphanedBrandingFiles)) {
                $this->info('No orphaned store branding files found.');
            } else {
                $this->warn('Found ' . count($orphanedBrandingFiles) . ' orphaned store branding file(s):');
                foreach ($orphanedBrandingFiles as $file) {
                    $size = round(Storage::disk('public')->size($file) / 1024 / 1024, 2);
                    $this->line(" - {$file} ({$size} MB)");
                }

                if ($force) {
                    $this->comment('Deleting orphaned store branding files...');
                    foreach ($orphanedBrandingFiles as $file) {
                        Storage::disk('public')->delete($file);
                        $this->info("Deleted: {$file}");
                    }
                }
            }
        }

        $this->line('');
        if ($force) {
            $this->info('========================================================');
            $this->info('   SUCCESS: Image recovery and storage cleanup complete!   ');
            $this->info('========================================================');
        } else {
            $this->info('========================================================');
            $this->info('   DRY-RUN COMPLETE. No actual changes were made.      ');
            $this->info('   Run with --force to execute the actions shown.      ');
            $this->info('========================================================');
        }
    }
}
