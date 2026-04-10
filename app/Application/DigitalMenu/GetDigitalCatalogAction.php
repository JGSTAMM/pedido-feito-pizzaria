<?php

namespace App\Application\DigitalMenu;

use App\Http\Resources\NeighborhoodResource;
use App\Http\Resources\PizzaFlavorResource;
use App\Http\Resources\PizzaSizeResource;
use App\Http\Resources\ProductResource;
use App\Models\Neighborhood;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;

class GetDigitalCatalogAction
{
    public function execute(): array
    {
        $flavors = PizzaFlavor::query()
            ->where('is_active', true)
            ->where('show_on_digital_menu', true)
            ->orderBy('name')
            ->get();

        $products = Product::query()
            ->where('show_on_digital_menu', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $tables = Table::query()
            ->withCount('activeOrders')
            ->orderBy('name')
            ->get()
            ->map(static function (Table $table) {
                $isFree = (int) $table->active_orders_count === 0;

                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'status' => $isFree ? 'free' : 'occupied',
                    'is_available_for_dine_in' => $isFree,
                ];
            });

        return [
            'storeSetting' => \App\Models\StoreSetting::first(),
            'pizza_sizes' => PizzaSizeResource::collection(PizzaSize::all()),
            'pizza_flavors' => PizzaFlavorResource::collection($flavors),
            'products' => ProductResource::collection($products),
            'neighborhoods' => NeighborhoodResource::collection(
                Neighborhood::query()->orderBy('city')->orderBy('name')->get()
            ),
            'tables' => $tables,
        ];
    }
}
