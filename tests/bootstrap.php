<?php

$loader = require __DIR__.'/../vendor/autoload.php';
$baseDir = dirname(__DIR__);

// Configure PSR-4 to load directly from the current worktree
$loader->setPsr4('App\\', [$baseDir.'/app']);
$loader->setPsr4('Database\\Factories\\', [$baseDir.'/database/factories']);
$loader->setPsr4('Database\\Seeders\\', [$baseDir.'/database/seeders']);
$loader->setPsr4('Tests\\', [__DIR__]);

// Clear precompiled classmap entries for App\, Tests\, and Database\ so PSR-4 is used for the worktree
$ref = new ReflectionClass($loader);
$prop = $ref->getProperty('classMap');
$map = $prop->getValue($loader);
foreach ($map as $class => $path) {
    if (str_starts_with($class, 'App\\') || str_starts_with($class, 'Tests\\') || str_starts_with($class, 'Database\\')) {
        unset($map[$class]);
    }
}
$prop->setValue($loader, $map);

return $loader;
