<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Table;
use App\Models\PizzaSize;
use App\Models\PizzaFlavor;
use App\Models\Product;

class DataController extends Controller
{
    public function index()
    {
        return response()->json([
            'tables' => Table::select('id', 'name', 'status')->get(),
            'pizza_sizes' => PizzaSize::select('id', 'name', 'slices', 'max_flavors', 'is_special_broto_rule')->get(),
            'pizza_flavors' => PizzaFlavor::select('id', 'name', 'base_price', 'description')->get(), 
            'products' => Product::select('id', 'name', 'price', 'category')->get(),
        ]);
    }
}
