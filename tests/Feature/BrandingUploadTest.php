<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BrandingUploadTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_upload_logo_cover_and_mixed_image_video_stories(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        StoreSetting::create([
            'store_name' => 'Pizzaria Teste',
            'cnpj' => '00.000.000/0001-00',
            'is_open' => true,
        ]);

        $tinyPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');

        $response = $this->actingAs($admin)->post('/settings/branding', [
            'logo_image' => UploadedFile::fake()->createWithContent('logo.png', $tinyPng),
            'cover_image' => UploadedFile::fake()->createWithContent('cover.png', $tinyPng),
            'update_stories' => true,
            'story_media' => [
                ['url' => 'https://example.com/storage/branding/existing.jpg', 'type' => 'image'],
                UploadedFile::fake()->create('story-promo.mp4', 12288, 'video/mp4'),
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $settings = StoreSetting::firstOrFail();
        $this->assertNotNull($settings->logo_image);
        $this->assertNotNull($settings->cover_image);
        Storage::disk('public')->assertExists($settings->logo_image);
        Storage::disk('public')->assertExists($settings->cover_image);

        $rawStories = json_decode((string) $settings->getRawOriginal('story_media'), true);
        $this->assertCount(2, $rawStories);
        $this->assertEquals('branding/existing.jpg', $rawStories[0]['url']);
        $this->assertEquals('video', $rawStories[1]['type']);
        Storage::disk('public')->assertExists($rawStories[1]['url']);
    }

    public function test_story_upload_rejects_files_larger_than_20mb_or_invalid_mime(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        StoreSetting::create([
            'store_name' => 'Pizzaria Teste',
            'cnpj' => '00.000.000/0001-00',
            'is_open' => true,
        ]);

        $oversized = $this->actingAs($admin)->post('/settings/branding', [
            'update_stories' => true,
            'story_media' => [
                UploadedFile::fake()->create('too-big.mp4', 21504, 'video/mp4'),
            ],
        ]);
        $oversized->assertSessionHasErrors('story_media');

        $invalidExt = $this->actingAs($admin)->post('/settings/branding', [
            'update_stories' => true,
            'story_media' => [
                UploadedFile::fake()->create('script.php', 10, 'application/x-php'),
            ],
        ]);
        $invalidExt->assertSessionHasErrors('story_media');
    }

    public function test_post_too_large_exception_returns_friendly_error_instead_of_html_error_page(): void
    {
        Route::post('/test-post-too-large', function () {
            throw new PostTooLargeException('Payload too large');
        });

        $webResponse = $this->from('/settings')->post('/test-post-too-large');
        $webResponse->assertRedirect('/settings');
        $webResponse->assertSessionHas('error');

        $apiResponse = $this->postJson('/test-post-too-large');
        $apiResponse->assertStatus(413)
            ->assertJson([
                'success' => false,
                'error_code' => 'PAYLOAD_TOO_LARGE',
            ]);
    }
}
