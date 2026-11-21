<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WaiterPwaManifestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        StoreSetting::create([
            'store_name' => 'Sr. & Sra. Lucchese Pizzaria',
            'is_open' => true,
        ]);
    }

    public function test_public_menu_uses_digital_menu_manifest(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('/manifest.webmanifest?v=2', false);
    }

    public function test_waiter_route_uses_dedicated_waiter_manifest(): void
    {
        $waiter = User::factory()->create(['role' => 'waiter']);

        $response = $this->actingAs($waiter)->get('/waiter');

        $response->assertOk();
        $response->assertSee('/manifest-waiter.webmanifest?v=1', false);
    }

    public function test_login_uses_staff_manifest_by_default_and_waiter_manifest_when_targeted(): void
    {
        $loginResponse = $this->get('/login');
        $loginResponse->assertOk();
        $loginResponse->assertSee('/manifest-staff.webmanifest?v=1', false);

        $waiterLoginResponse = $this->get('/login?app=waiter');
        $waiterLoginResponse->assertOk();
        $waiterLoginResponse->assertSee('/manifest-waiter.webmanifest?v=1', false);

        // Accessing /waiter while unauthenticated redirects to /login with url.intended pointing to /waiter
        $redirectedLogin = $this->followingRedirects()->get('/waiter');
        $redirectedLogin->assertOk();
        $redirectedLogin->assertSee('/manifest-waiter.webmanifest?v=1', false);
    }

    public function test_static_manifest_files_exist_with_distinct_start_urls(): void
    {
        $menuManifest = json_decode(file_get_contents(public_path('manifest.webmanifest')), true);
        $waiterManifest = json_decode(file_get_contents(public_path('manifest-waiter.webmanifest')), true);
        $staffManifest = json_decode(file_get_contents(public_path('manifest-staff.webmanifest')), true);

        $this->assertEquals('/', $menuManifest['start_url']);
        $this->assertEquals('/waiter', $waiterManifest['start_url']);
        $this->assertEquals('/waiter', $waiterManifest['id']);
        $this->assertEquals('/login', $staffManifest['start_url']);
        $this->assertEquals('/login', $staffManifest['id']);
    }
}
