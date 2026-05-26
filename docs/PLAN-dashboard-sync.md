# PLAN: Dashboard Data Sync

## 1. 🔍 The Root Cause
The checkout transaction and database updates executed perfectly. The database transaction committed, the `Order` status was updated to `completed`, the `paid_at` timestamp was correctly set, and the `Payment` records were successfully stored with proper Math in Cents mutations.

The issue lies entirely in the Eloquent queries powering the "Pedidos" (Orders) and "Dashboard" pages. These queries are strictly filtering and sorting by `created_at`. The order for Mesa 6 (or Mesa 5) was originally opened/created on May 16th. Because today is May 26th, the backend explicitly filters this order out of today's statistics and buries it at the bottom of the list.

## 2. 🗺️ The Disconnect
**What was saved in the DB:**
- `status`: "completed"
- `paid_at`: "2026-05-26 21:42:37"
- `created_at`: "2026-05-16 01:15:20"

**What the Dashboard expects (in `OrderController.php` & `DashboardController.php`):**
- **Stats Filtering:** `$todayOrders = Order::whereDate('created_at', today());`
  *Disconnect:* Because it looks at `created_at`, it ignores the payment that happened *today*. Your today's revenue does not reflect the payment.
- **List Sorting:** `->orderByDesc('created_at')`
  *Disconnect:* The order list sorts by the creation date. An order opened days ago that was just paid gets pushed down the list (or completely truncated by `limit(100)`) instead of popping up to the top.

## 3. 🛠️ The Proposed Solution
To fix the disconnect without altering the frontend React components, the backend controllers must be refactored to prioritize business events (`paid_at` and `updated_at`) over creation time:

**Step 1: Refactor Financial Stats (`OrderController.php` & `DashboardController.php`)**
Change the revenue and completed orders queries to recognize revenue on the day it was *paid*, not opened:
```php
// Before
$todayOrders = Order::whereDate('created_at', today());
'revenue_today' => ((float) $todayOrders->clone()->whereNotNull('paid_at')->sum('total_amount')) / 100,

// After (Proposed)
'revenue_today' => ((float) Order::whereDate('paid_at', today())->sum('total_amount')) / 100,
'completed_today' => Order::whereDate('paid_at', today())->count(),
```

**Step 2: Refactor Order Lists Sorting**
Change the lists to sort by `updated_at` so that newly closed tables and newly accepted orders immediately jump to the top of the Dashboard.
```php
// Before
$orders = Order::with([...])->orderByDesc('created_at')->limit(100)->get();

// After (Proposed)
$orders = Order::with([...])->orderByDesc('updated_at')->limit(100)->get();
```

**Step 3: Keep Pending Stats Accurate**
For active/pending orders, `created_at` or simply filtering by active statuses remains correct.
