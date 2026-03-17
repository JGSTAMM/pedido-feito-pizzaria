<?php

namespace Tests\Feature;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ErrorDisclosureTest extends TestCase
{
    public function test_api_returns_generic_error_without_leaking_internal_details_in_production(): void
    {
        config([
            'app.debug' => false,
            'app.locale' => 'pt_BR',
        ]);

        $path = '/api/test/error-disclosure-' . Str::uuid();

        Route::middleware('api')->get($path, static function () {
            throw new RuntimeException('SQLSTATE[42S02]: Base table or view not found: 1146 Table missing');
        });

        $response = $this->getJson($path);

        $response->assertStatus(500)
            ->assertJsonStructure([
                'success',
                'message',
                'error_code',
            ])
            ->assertJson([
                'success' => false,
                'message' => __('common.error.unexpected'),
                'error_code' => 'UNEXPECTED_ERROR',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('Base table or view not found', $response->getContent());
        $this->assertStringNotContainsString('Table missing', $response->getContent());
    }
}
