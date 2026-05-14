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

// Default Laravel user model channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for Waiter App — per-table real-time updates.
// Any authenticated staff member can subscribe to any table channel.
Broadcast::channel('tables.{tableId}', function ($user, $tableId) {
    return $user !== null;
});
