<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Bidirectional search: accepts a 'query' param.
     * If digits only → search by phone.
     * If letters → search by name LIKE.
     * Returns up to 8 results.
     */
    public function search(Request $request)
    {
        $raw = trim($request->input('query', $request->input('phone', '')));

        if (strlen($raw) < 2) {
            return response()->json(['found' => false, 'customers' => []]);
        }

        $digits = preg_replace('/\D/', '', $raw);

        $query = Customer::query();

        if (strlen($digits) >= 10 && strlen($digits) === strlen(preg_replace('/\s/', '', $raw))) {
            // Looks like a phone number
            $query->where('phone', $digits);
        } else {
            // Name search (case-insensitive LIKE)
            $query->where('name', 'like', "%{$raw}%");
        }

        $customers = $query->orderBy('name')->limit(8)->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'phone' => $c->phone,
            'orders_count' => $c->orders()->count(),
        ]);

        // Legacy single-result format for phone search
        if ($customers->count() === 1 && strlen($digits) >= 10) {
            return response()->json([
                'found' => true,
                'customer' => $customers->first(),
                'customers' => $customers,
            ]);
        }

        return response()->json([
            'found' => $customers->isNotEmpty(),
            'customers' => $customers,
        ]);
    }
}
