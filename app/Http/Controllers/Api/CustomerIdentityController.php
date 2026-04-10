<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerIdentityController extends Controller
{
    /**
     * POST /api/customers/identify
     * Identifies a customer by phone. Creates if name is provided and doesn't exist.
     */
    public function identify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|max:20',
            'name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = preg_replace('/[^0-9]/', '', $request->input('phone'));
        $name = $request->input('name');

        $customer = Customer::where('phone', $phone)->first();

        if ($customer) {
            $response = response()->json([
                'success' => true,
                'found' => true,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ],
            ]);
            
            return $response->cookie('customer_phone', $customer->phone, 60 * 24 * 365);
        }

        if ($name) {
            $customer = Customer::create([
                'name' => $name,
                'phone' => $phone,
            ]);

            $response = response()->json([
                'success' => true,
                'found' => true,
                'created' => true,
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ],
            ]);
            
            return $response->cookie('customer_phone', $customer->phone, 60 * 24 * 365);
        }

        return response()->json([
            'success' => true,
            'found' => false,
        ]);
    }
}
