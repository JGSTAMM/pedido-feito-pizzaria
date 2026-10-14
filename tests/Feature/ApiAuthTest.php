<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_waiter_can_login()
    {
        $user = User::factory()->create([
            'email' => 'waiter@test.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'waiter@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user',
            ]);
    }

    public function test_login_fails_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'waiter@test.com',
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'waiter@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_revokes_previous_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'waiter@test.com',
            'password' => bcrypt('password'),
        ]);

        // Create an existing token
        $oldToken = $user->createToken('mobile')->plainTextToken;
        $this->assertEquals(1, $user->tokens()->count());

        // Login again
        $response = $this->postJson('/api/login', [
            'email' => 'waiter@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);

        // Previous token must be revoked, only 1 new active token exists
        $this->assertEquals(1, $user->fresh()->tokens()->count());
        $this->assertNotEquals($oldToken, $response->json('token'));
    }
}
