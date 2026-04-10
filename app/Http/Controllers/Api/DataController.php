<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PizzaFlavorResource;
use App\Http\Resources\PizzaSizeResource;
use App\Http\Resources\ProductResource;
use App\Models\PizzaFlavor;
use App\Models\PizzaSize;
use App\Models\Product;
use App\Models\Table;

class DataController extends Controller
{
    public function index()
    {
        return response()->json([
            'tables'        => Table::select('id', 'name', 'status')->get(),
            'pizza_sizes'   => PizzaSizeResource::collection(PizzaSize::all()),
            'pizza_flavors' => PizzaFlavorResource::collection(
                PizzaFlavor::where('is_active', true)->get()
            ),
            'products'      => ProductResource::collection(
                Product::where('is_active', true)->get()
            ),
        ]);
    }
}
