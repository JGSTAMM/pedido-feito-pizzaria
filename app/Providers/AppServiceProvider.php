<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Table;
use App\Policies\OrderPolicy;
use App\Policies\TablePolicy;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Table::class, TablePolicy::class);

        Model::preventLazyLoading(! app()->isProduction());
    }
}
