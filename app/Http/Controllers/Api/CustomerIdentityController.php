<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
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

        $phone = preg_replace('/[^0-9]/', '', (string) $request->input('phone')) ?? '';
        if (strlen($phone) < 10 || strlen($phone) > 13) {
            return response()->json([
                'success' => false,
                'errors' => ['phone' => ['Informe um número de telefone válido com DDD.']],
            ], 422);
        }

        $name = trim((string) $request->input('name', ''));

        // Never expose phone existence (enumeration oracle) or stored PII on unauthenticated lookup.
        if ($name === '') {
            return response()->json([
                'success' => true,
                'found' => false,
            ]);
        }

        $customer = Customer::where('phone', $phone)->first();

        if (! $customer) {
            // Create only when absent; never overwrite existing CRM customer.name from unauthenticated calls.
            Customer::create([
                'name' => $name,
                'phone' => $phone,
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->put('customer_phone', $phone);
        }

        // Return an identical payload and cookie regardless of whether the phone already existed.
        return response()->json([
            'success' => true,
            'found' => false,
            'identified' => true,
            'customer' => [
                'name' => $name,
                'phone' => $phone,
            ],
        ])->cookie('customer_phone', $phone, 60 * 24 * 365);
    }

    /**
     * POST /api/customers/logout
     * Clears server-side customer identity session keys and expires the customer_phone cookie.
     */
    public function logout(Request $request)
    {
        if ($request->hasSession()) {
            $request->session()->forget([
                'customer_phone',
                'current_order_id',
                'owned_order_ids',
                'owned_table_id',
            ]);
        }

        return response()->json(['success' => true])
            ->withCookie(Cookie::forget('customer_phone'));
    }
}
