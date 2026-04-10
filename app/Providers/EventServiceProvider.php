<?php

namespace App\Providers;

use App\Events\OrderCreatedForPrinting;
use App\Listeners\DispatchOrderPrintingJobs;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderCreatedForPrinting::class => [
            DispatchOrderPrintingJobs::class,
        ],
    ];
}
