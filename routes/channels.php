<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
| Channel Security Strategy:
|   - 'orders'          → Public  (KDS runs on kitchen tablets, may be unauthenticated)
|   - 'order.{orderId}' → Public  (UUID orderId is not guessable; no PII in payload)
|   - 'tables.{id}'     → Private (Waiter App requires authenticated session)
|
*/

// Default Laravel user model channel (strict string UUID comparison)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

// Private channel for authenticated staff (KDS, Floor, Orders, Print Agent notifications)
Broadcast::channel('orders', function ($user) {
    return $user !== null && in_array(strtolower(trim((string) $user->role)), ['admin', 'cashier', 'caixa', 'waiter', 'garcom'], true);
});

// Private channel for Waiter App — per-table real-time updates.
// Any authenticated staff member can subscribe to any table channel.
Broadcast::channel('tables.{tableId}', function ($user, $tableId) {
    return $user !== null && in_array(strtolower(trim((string) $user->role)), ['admin', 'cashier', 'caixa', 'waiter', 'garcom'], true);
});
