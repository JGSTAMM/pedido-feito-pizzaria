<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $baseDir = dirname(__DIR__);
        $_ENV['APP_BASE_PATH'] = $baseDir;
        $_SERVER['APP_BASE_PATH'] = $baseDir;
        putenv('APP_BASE_PATH='.$baseDir);

        $app = require $baseDir.'/bootstrap/app.php';

        $this->traitsUsedByTest = array_flip(class_uses_recursive(static::class));

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
