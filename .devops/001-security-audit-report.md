# 🛡️ Security Audit Report — Pedido Feito 2.0

> **Auditor:** Principal Security Engineer (Automated Deep Audit)
> **Date:** 2026-08-17
> **Scope:** Laravel 11 + PHP 8.4 + Inertia.js + React 19 — Backend-only audit
> **Classification:** CONFIDENTIAL — Internal Engineering Use Only
> **Methodology:** OWASP Top 10 (2025), Manual Code Review, Static Analysis Patterns

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 4 |
| 🟠 HIGH | 5 |
| 🟡 MEDIUM | 6 |
| 🔵 LOW | 3 |
| **Total Findings** | **18** |

The codebase demonstrates a **solid architectural foundation** — Eloquent mutators enforce integer-cent storage across all monetary models, Laravel Policies protect sensitive operations, webhook signatures are validated via HMAC-SHA256, and `lockForUpdate()` is applied at key payment checkpoints.

However, the audit uncovered **4 CRITICAL vulnerabilities** that could result in financial loss, race conditions, or unauthorized access in a concurrent production environment. These must be patched before any production deployment.

---

## CRITICAL Findings

### C-01: Race Condition in `PayAndCloseTableAction` — Float Arithmetic on Locked Data

**Files:**
- [`PayAndCloseTableAction.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/Orders/PayAndCloseTableAction.php#L37-L42)

**Description:**
The action correctly uses `lockForUpdate()` on line 29, but then **immediately casts locked integer-cent values to float** for comparison:

```php
$totalAmount = (float) $orders->sum('total_amount');   // L37 — mutator returns float!
$totalPaid = (float) collect($payments)->sum('amount'); // L38

if ($totalPaid < $totalAmount - 0.01) {                // L40 — FLOAT COMPARISON WITH EPSILON
```

This is a **dual vulnerability**:

1. **Floating-point precision loss:** The `total_amount` mutator already divides by 100 (`$value / 100`), so `$orders->sum('total_amount')` returns a float sum of floats. When two waiters independently add orders totaling `R$10.07` + `R$33.33`, the float sum may not equal `43.40` exactly. The `0.01` epsilon is arbitrary and can cause **under-payment to be silently accepted** or **valid payment to be rejected**.

2. **Lock scope gap:** The lock acquires a row-level write lock, but the `$payments` array comes from user input — it is NOT locked. A concurrent request could slip in and pay a table that was already being processed if the DB commit is slow.

**Impact:** Financial loss via underpayment acceptance; order corruption under load.

**Severity:** 🔴 CRITICAL

**Recommended Fix:**
```php
// Work entirely in integer cents — bypass mutators
$totalAmountCents = (int) $orders->sum(fn ($o) => $o->getRawOriginal('total_amount'));
$totalPaidCents = (int) collect($payments)->sum(fn ($p) => (int) round($p['amount'] * 100));

if ($totalPaidCents < $totalAmountCents) {
    // Reject — no epsilon needed with integers
}
```

---

### C-02: POS Checkout `PosController@store` Has ZERO Concurrency Protection

**Files:**
- [`PosController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/PosController.php#L176-L351)

**Description:**
The POS checkout (`store()`) uses `DB::beginTransaction()` but **never acquires any pessimistic lock**. Unlike `FloorController@payAndClose` which correctly uses `lockForUpdate()`, the POS path has no protection against:

- **Double-submit:** A cashier clicks "Finalizar Pedido" twice in rapid succession → two identical orders are created, two payment records are written, and the cash register total is inflated.
- **Concurrent register access:** `$this->cashRegisterLockService->requireOpenRegister()` on L170 uses `latest()->first()` **without a lock**, so two concurrent POS checkouts could both succeed against the same register while it's being closed on another terminal.

**Impact:** Duplicate orders, double-charged customers, inflated cash register totals.

**Severity:** 🔴 CRITICAL

**Recommended Fix:**
- Add `Cache::lock("pos_checkout_{$userId}", 10)` idempotency guard or use `lockForUpdate()` on the `CashRegister` query inside the transaction.
- Accept a client-side idempotency key (`X-Idempotency-Key` header) and reject duplicate submissions within a TTL window.

---

### C-03: `CashRegisterController@close` — No Owner Scoping on Register Query

**Files:**
- [`web.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/routes/web.php#L59-L60)
- [`CashRegisterController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/CashRegisterController.php#L60-L84)

**Description:**
The route definition applies the Policy correctly:
```php
Route::post('/cash-register/close', [CashRegisterController::class, 'close'])
    ->middleware('can:closeCashRegister,'.Order::class);
```

**BUT** the `close()` method on L64 queries:
```php
$register = CashRegister::where('status', 'open')
    ->latest()
    ->firstOrFail();
```

This fetches **ANY open register, regardless of which user opened it**. The policy check only validates that the user *has permission to close a register* (admin/cashier role), not that they are closing **their own** register. In contrast, `PosController@index` L79 correctly scopes to `Auth::id()`.

**Impact:** A cashier on Terminal A could close the register that a different cashier opened on Terminal B, causing financial audit mismatches.

**Severity:** 🔴 CRITICAL

**Recommended Fix:**
```php
$register = CashRegister::where('status', 'open')
    ->where('user_id', Auth::id()) // SCOPE TO OWNER
    ->latest()
    ->firstOrFail();
```

---

### C-04: `CashRegisterController@open` — No Duplicate Open Register Guard

**Files:**
- [`CashRegisterController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/CashRegisterController.php#L46-L58)

**Description:**
The `open()` method creates a new `CashRegister` without checking if one is already open:

```php
CashRegister::create([
    'user_id' => Auth::id(),
    'opened_at' => now(),
    'opening_balance' => $request->opening_balance,
    'status' => 'open',
]);
```

There is **no uniqueness constraint** or application-level guard preventing multiple open registers. Double-clicking "Open Register" or concurrent requests from different admin sessions will create phantom registers, corrupting all financial summaries that query `CashRegister::where('status', 'open')->latest()`.

**Impact:** Financial corruption — sales attributed to wrong register; summary reports show incomplete data.

**Severity:** 🔴 CRITICAL

**Recommended Fix:**
```php
$existingOpen = CashRegister::where('status', 'open')->lockForUpdate()->first();
if ($existingOpen) {
    return redirect()->back()->withErrors(['error' => 'A register is already open.']);
}
```
Plus a database unique partial index: `CREATE UNIQUE INDEX ... WHERE status = 'open'`.

---

## HIGH Findings

### H-01: `FloorController@pixPaymentStatus` — IDOR: No Ownership Verification

**Files:**
- [`FloorController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/FloorController.php#L604-L618)

**Description:**
The route `/floor/pix-status/{order}` uses Laravel's implicit model binding with the `Order` UUID. **Any authenticated user** (admin, cashier, or waiter) can poll the payment status of **any order** by guessing/enumerating UUIDs.

While UUIDs reduce brute-force risk, the endpoint still leaks internal payment state (`approved`/`pending`) for arbitrary orders. The API-side `OnlinePaymentController@paymentStatus` correctly validates session ownership, but the Floor variant does not.

**Impact:** Information disclosure; potential for a waiter to confirm payment status of orders they shouldn't access.

**Severity:** 🟠 HIGH

**Recommended Fix:**
Verify that the order belongs to a table with active orders assigned to the requesting user's current context, or verify `cash_register_id` matches.

---

### H-02: `Api\OrderController@closeTable` — No Pessimistic Lock on Table Closure

**Files:**
- [`Api/OrderController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/Api/OrderController.php#L186-L208)

**Description:**
```php
$activeOrders = $table->activeOrders()->get(); // NO LOCK
foreach ($activeOrders as $order) {
    $order->update(['status' => 'completed']);
}
$table->update(['status' => 'available']);
```

This endpoint closes a table **without** `lockForUpdate()`, creating a TOCTOU (Time-Of-Check-To-Time-Of-Use) race. If a waiter adds items to a table at the exact moment an admin closes it, the newly added order will persist against a now-"available" table — an orphaned order that won't appear in any financial summary.

**Impact:** Orphaned orders; missing revenue in cash register reports.

**Severity:** 🟠 HIGH

**Recommended Fix:**
Wrap in a transaction with `lockForUpdate()`, consistent with `FloorController@payAndClose`.

---

### H-03: `Api\OrderController@payAndCloseTable` — Float-Based Payment Validation

**Files:**
- [`PayAndCloseTableAction.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/Orders/PayAndCloseTableAction.php#L37-L82)
- [`Api/OrderController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/Api/OrderController.php#L217-L221)

**Description:**
The API validation accepts `payments.*.amount` as `numeric|min:0` (**float**), which flows into `PayAndCloseTableAction` where it's summed as floats and compared with float epsilon `0.001`. Meanwhile, `FloorController@payAndClose` validates `payments.*.amount` as `integer|min:0` (**cents**).

This **inconsistency** means the same business logic (`PayAndCloseTableAction`) receives two different unit systems depending on the entry point:
- Web (Floor): integer cents
- API (waiter app): float reais

The action code uses `(float)` casts throughout, which silently converts both, but the epsilon comparisons (`0.001`, `0.01`) can produce **different accept/reject decisions** depending on the caller.

**Impact:** Payment validation inconsistency between web and mobile; possible under/over-payment acceptance.

**Severity:** 🟠 HIGH

**Recommended Fix:**
Standardize the API to accept **integer cents** and normalize at the action boundary. Remove all float epsilon comparisons.

---

### H-04: Sanctum API Token Never Expires and Has No Revocation on Logout

**Files:**
- [`Api/AuthController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/Api/AuthController.php#L12-L35)

**Description:**
The API login creates a Sanctum token with no expiration:
```php
$token = $user->createToken('mobile')->plainTextToken;
```

There is **no API logout endpoint** and no token expiration configured. A leaked or stolen token grants indefinite access. Additionally, each login creates a new token **without revoking previous ones**, leading to token accumulation.

**Impact:** Indefinite unauthorized access if a waiter's phone is compromised.

**Severity:** 🟠 HIGH

**Recommended Fix:**
```php
// Set expiration in config/sanctum.php
'expiration' => 480, // 8 hours

// Add logout endpoint
public function logout(Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out']);
}

// Revoke previous tokens on login
$user->tokens()->where('name', 'mobile')->delete();
$token = $user->createToken('mobile')->plainTextToken;
```

---

### H-05: `CashRegisterController@close` — Unvalidated/Unsanitized `notes` Field

**Files:**
- [`CashRegisterController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/CashRegisterController.php#L60-L84)

**Description:**
The `close()` method writes `$request->notes` directly to the database without any validation or sanitization:
```php
$register->update([
    // ...
    'notes' => $request->notes, // RAW INPUT — NO VALIDATION
]);
```

The `notes` field is not included in the `$request->validate([...])` call (only `closing_balance` is validated). While Inertia.js does HTML-encode output by default (React's JSX auto-escaping), the `notes` value is also used in cash register history reports and potential CSV exports.

**Impact:** Stored XSS risk in non-React rendering contexts; CSV injection in exports.

**Severity:** 🟠 HIGH

**Recommended Fix:**
```php
$request->validate([
    'closing_balance' => 'required|numeric|min:0',
    'notes' => 'nullable|string|max:1000', // VALIDATE AND CAP
]);
```

---

## MEDIUM Findings

### M-01: `HybridPizzaPricingService` Returns `0.0` for Invalid Inputs Instead of Throwing

**Files:**
- [`HybridPizzaPricingService.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/Pricing/HybridPizzaPricingService.php#L12-L31)

**Description:**
```php
if (! $size) { return 0.0; }
if ($flavors->isEmpty()) { return 0.0; }
```

If an invalid `$sizeId` or empty `$flavorIds` is passed, the service silently returns `R$0.00` instead of throwing an exception. This creates a **free pizza attack vector**: a tampered API request with `flavor_ids: []` or a non-existent `size_id` results in a `R$0.00` order item.

**Impact:** Zero-price items in orders; revenue loss.

**Severity:** 🟡 MEDIUM

**Recommended Fix:**
```php
if (! $size) {
    throw new \InvalidArgumentException("Pizza size not found: {$sizeId}");
}
if ($flavors->isEmpty()) {
    throw new \InvalidArgumentException("No valid flavors provided");
}
```

---

### M-02: `BuildCashRegisterHistoryAction` — Unvalidated Date Range from Request

**Files:**
- [`BuildCashRegisterHistoryAction.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/CashRegister/BuildCashRegisterHistoryAction.php#L16-L19)

**Description:**
The `start_date` and `end_date` are used directly in a `whereDate()` clause without validation. An extremely wide date range could cause a full table scan.

**Impact:** Performance degradation; poor error UX.

**Severity:** 🟡 MEDIUM

---

### M-03: Broto Pizza Price Uses Hardcoded Float Constant

**Files:**
- [`HybridPizzaPricingService.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/Pricing/HybridPizzaPricingService.php#L10)

**Description:**
`BROTO_FIXED_FEE = 5.00` combined with `base_price / 2` introduces floating-point accumulation error potential. While `round()` masks most errors, the approach is fragile.

**Impact:** Occasional 1-cent rounding errors in broto pizza pricing.

**Severity:** 🟡 MEDIUM

---

### M-04: `EnsureNoPendingOrdersForCloseAction` — Overly Broad `orWhere` Clause

**Files:**
- [`EnsureNoPendingOrdersForCloseAction.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/CashRegister/EnsureNoPendingOrdersForCloseAction.php#L12-L20)

**Description:**
The `orWhere('created_at', '>=', $register->opened_at)` catches orders from **all** sources created after the register opened, not just orders linked to this register. This will block register closure for unrelated pending orders in multi-terminal setups.

**Impact:** False-positive register close blocking.

**Severity:** 🟡 MEDIUM

---

### M-05: `FloorController@payAndClose` — Double Status Update (Paid then Completed)

**Files:**
- [`FloorController.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Http/Controllers/FloorController.php#L467-L500)

**Description:**
Each order is updated to `'paid'` then immediately overwritten to `'completed'` in the same loop iteration — two unnecessary DB round-trips per order. The `'paid'` status never persists meaningfully.

**Impact:** Unnecessary DB writes; confusing audit trail.

**Severity:** 🟡 MEDIUM

---

### M-06: Online Checkout Creates Order with `total_amount = 0` Temporarily

**Files:**
- [`ProcessOnlineCheckoutAction.php`](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/app/Application/Checkout/ProcessOnlineCheckoutAction.php#L42-L67)

**Description:**
The order is saved with `total_amount => 0` before items are created, then updated. If any event fires between the two saves, it observes a `R$0.00` order.

**Impact:** Transient data inconsistency observable by real-time listeners.

**Severity:** 🟡 MEDIUM

---

## LOW Findings

### L-01: Manual `/100` Division Pattern for `sum()` Queries

**Files:** `OrderController.php:L52`, `DashboardController.php:L18-19`, `ReportController.php:L17-19`

The pattern `((float) Order::sum('total_amount')) / 100` is used repeatedly because `sum()` bypasses mutators. Correct but fragile — should be extracted to a reusable method.

### L-02: Generic Sanctum Token Name `'mobile'`

All mobile tokens are named `'mobile'`, making device-level audit impossible.

### L-03: Webhook Logging Includes Full Payload

`Log::info('Mercado Pago webhook received', $request->all())` logs the entire payload including potentially sensitive payment metadata.

---

## Positive Findings ✅

| Area | Assessment |
|------|------------|
| **Integer-cent storage** | ✅ All monetary models use `Attribute` mutators with `(int) round($value * 100)` setters |
| **Webhook HMAC validation** | ✅ Timing-safe `hash_equals()` comparison |
| **Webhook idempotency** | ✅ `Cache::add()` deduplication with 24h TTL |
| **Policy-based authorization** | ✅ Properly restricted via `OrderPolicy` and `TablePolicy` |
| **Role middleware** | ✅ `EnsureUserHasRole` with Portuguese alias normalization |
| **Server-side price calculation** | ✅ Client-sent prices are ignored for totals |
| **Rate limiting** | ✅ Appropriate throttle on all public API endpoints |
| **Supervisor PIN protection** | ✅ Per-IP rate limiting + bcrypt verification |
| **Pessimistic locking** | ✅ Applied at `PayAndCloseTableAction` and `FloorController@payAndClose` |
| **Soft deletes** | ✅ `Order`, `OrderItem`, `Payment` all use `SoftDeletes` |

---

## Recommended Patching Priority

| Priority | Finding | Estimated Effort |
|----------|---------|-----------------|
| 1 | **C-02** — POS idempotency guard | 2h |
| 2 | **C-04** — Duplicate register guard | 1h |
| 3 | **C-03** — Register owner scoping | 30min |
| 4 | **C-01** — Integer-cent payment validation | 3h |
| 5 | **H-04** — Sanctum token expiration + logout | 1h |
| 6 | **H-03** — Standardize API payment units | 2h |
| 7 | **H-02** — closeTable lock | 30min |
| 8 | **H-05** — Validate `notes` field | 15min |
| 9 | **H-01** — pixPaymentStatus ownership | 30min |
| 10 | **M-01** — Pricing service throw on invalid | 30min |

**Total estimated effort for CRITICAL + HIGH fixes: ~10.5 hours**

---

## Next Steps

> **⚠️ This report is READ-ONLY. No code has been modified.**
> Awaiting human approval before proceeding with the patching phase.

1. ✅ Review this report
2. ⏳ Approve patching of CRITICAL findings (C-01 through C-04)
3. ⏳ Approve patching of HIGH findings (H-01 through H-05)
4. ⏳ Schedule MEDIUM/LOW fixes for next sprint

---

*Report generated by Principal Security Engineer — Pedido Feito 2.0 Audit Suite*
*Classification: CONFIDENTIAL*
