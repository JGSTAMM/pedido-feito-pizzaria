<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->json('story_media')->nullable()->after('logo_image');
        });

        // Migrate existing data
        $settings = DB::table('store_settings')->get();
        foreach ($settings as $setting) {
            $storyMedia = [];
            if ($setting->background_media_url) {
                $storyMedia[] = [
                    'url' => $setting->background_media_url,
                    'type' => $setting->background_media_type ?? 'image',
                ];
            }
            DB::table('store_settings')->where('id', $setting->id)->update([
                'story_media' => json_encode($storyMedia)
            ]);
        }

        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn('background_media_url');
            $table->dropColumn('background_media_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->string('background_media_url')->nullable();
            $table->string('background_media_type')->nullable();
        });

        $settings = DB::table('store_settings')->get();
        foreach ($settings as $setting) {
            $storyMedia = json_decode($setting->story_media, true);
            if (is_array($storyMedia) && count($storyMedia) > 0) {
                DB::table('store_settings')->where('id', $setting->id)->update([
                    'background_media_url' => $storyMedia[0]['url'],
                    'background_media_type' => $storyMedia[0]['type'] ?? 'image',
                ]);
            }
        }

        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn('story_media');
        });
    }
};
