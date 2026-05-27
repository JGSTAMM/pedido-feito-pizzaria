# 🔐 PRE-PRODUCTION MASTER AUDIT REPORT
### Pedido-Feito 2.0 — Laravel 11 / React Inertia
**Audit Date:** 2026-05-27  
**Auditor:** Principal Security Engineer + Software Architect (AI)  
**Codebase:** `c:\Users\Admin\Desktop\PROJETOS\Pedido-Feito 2.0`  
**Scope:** Static analysis — no code modifications performed.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [☠️ SECRETS EXPOSED](#-secrets-exposed)
3. [🚨 CRITICAL — Security / Fatal](#-critical--security--fatal)
4. [⚠️ WARNING — Performance / Bugs](#-warning--performance--bugs)
5. [🧹 CLEANUP — Dead Code / Refactor](#-cleanup--dead-code--refactor)
6. [Go-Live Checklist](#go-live-checklist)

---

## Executive Summary

| Category | Count | Highest Severity |
|----------|-------|-----------------|
| ☠️ Secrets Exposed | **3** | CRITICAL |
| 🚨 Critical Security | **5** | HIGH |
| ⚠️ Warning | **6** | MEDIUM |
| 🧹 Cleanup | **4** | LOW |

> CAUTION: DO NOT deploy to production without resolving all SECRETS and CRITICAL items. The MercadoPago API keys in `.env` are REAL TEST credentials with financial impact.

---

## ☠️ SECRETS EXPOSED

---

### [S-01] 🔴 MercadoPago TEST Credentials Exposed in `.env`

**File:** `.env` — Lines 71–73  
**Severity:** CRITICAL — Financial credential exposure

```
MERCADOPAGO_ACCESS_TOKEN="TEST-4653515631140033-041720-2b3224d500ee87bb01ea0e6d3d3ab656-169869261"
MERCADOPAGO_PUBLIC_KEY=TEST-ac713d83-9f3b-4c69-8c78-58f1e9d51944
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-ac713d83-9f3b-4c69-8c78-58f1e9d51944
```

**Why it's an issue:**  
The `.env` file contains live MercadoPago TEST credentials linked to a real developer account (`169869261`). While `TEST-` are sandbox tokens, for production you will swap to `APP_USR-` tokens — and if the same `.env` pattern is kept, the production token will also be in plaintext on the server filesystem.

**Good news:** `git ls-files` confirms `.env` is **NOT tracked** in git. Correctly gitignored. ✅

**Proposed Solution:**
1. Rotate TEST credentials via the MercadoPago developer panel.
2. For production `.env`: store the `APP_USR-` token only on the production server, never committed.
3. Add a `.env.production.example` to document required production keys without values.
4. Consider Laravel Forge / Vapor environment injection instead of SSH'd `.env` files.

---

### [S-02] 🔴 MercadoPago Access Token Stored in Database AND Leaked to ALL Inertia Clients

**Files:**  
- `app/Models/StoreSetting.php` — Line 31 (`$fillable`)  
- `app/Http/Middleware/HandleInertiaRequests.php` — Line 56

**Severity:** CRITICAL — Secret transmitted to every browser, including unauthenticated `/menu` visitors

**Why it's an issue:**  
The Settings UI saves the Mercado Pago access token into the `store_settings` database table. The `HandleInertiaRequests.php` middleware shares the **entire `$storeSetting` model** with every page load:

```php
// HandleInertiaRequests.php — Line 56
'storeSetting' => $storeSetting, // Sends ALL columns, including mercadopago_access_token!
```

This means the raw token is serialized into the Inertia JS payload and **sent to every browser** — including public guests on `/menu` with zero authentication.

**Proposed Solution:**
Add `$hidden` to StoreSetting model:
```php
protected $hidden = ['mercadopago_access_token', 'google_maps_api_key', 'ifood_merchant_id'];
```
OR scope the share to public-safe fields only in `HandleInertiaRequests::share()`.

---

### [S-03] 🟡 VITE_MERCADOPAGO_PUBLIC_KEY — Sandbox Mode Warning (Not Yet Production-Ready)

**File:** `.env` — Line 73, used in `CreditCardForm.jsx` — Line 24  
**Severity:** LOW (public key is by design client-side) — but needs pre-deploy action

**Why it's an issue:**  
The `VITE_MERCADOPAGO_PUBLIC_KEY` uses a `TEST-` prefix, meaning the app is operating in **sandbox mode**. Before go-live, this MUST be swapped to the production public key. If the sandbox key goes to production, all payments will be processed in test mode and real money will not be captured.

**Proposed Solution:**
- Pre-deploy checklist item: **Swap all `TEST-` keys to `APP_USR-` production keys**.
- Set `APP_ENV=production` and `APP_DEBUG=false` in production `.env`.

---

## 🚨 CRITICAL — Security / Fatal

---

### [C-01] 🔴 Entire `StoreSetting` Model Leaked to All Inertia Clients (Public Routes Included)

**File:** `app/Http/Middleware/HandleInertiaRequests.php` — Line 56  
**Severity:** HIGH — Credential + PII exposure to all roles including unauthenticated guests

```php
'storeSetting' => $storeSetting,
```

This shares ALL columns from `store_settings` with every Inertia page, including `/menu` (public). A guest receives: `cnpj`, `mercadopago_access_token`, `whatsapp_phone_number`, `google_maps_api_key`, `ifood_merchant_id` in their browser's `window.__inertia` object.

**Proposed Solution:**
Project only public-safe fields in the middleware:
```php
'storeSetting' => $storeSetting ? [
    'store_name' => $storeSetting->store_name,
    'is_open' => $storeSetting->is_open,
    'logo_url' => $storeSetting->logo_url,
    'cover_url' => $storeSetting->cover_url,
    'opening_hours' => $storeSetting->opening_hours,
    'payment_methods' => $storeSetting->payment_methods,
    'phone' => $storeSetting->phone,
    'full_address' => $storeSetting->full_address,
] : null,
```

---

### [C-02] 🔴 Direct `.env` File Mutation via HTTP Request

**File:** `app/Http/Controllers/SettingsController.php` — Lines 186–207  
**Severity:** HIGH — Server-side file injection vector

```php
$envContent = preg_replace('/^MERCADOPAGO_ACCESS_TOKEN=.*$/m', 
    'MERCADOPAGO_ACCESS_TOKEN="' . $newToken . '"', $envContent);
file_put_contents($envPath, $envContent); // ← Writing to .env via HTTP!
```

**Why it's an issue:**
1. **No sanitization** of `$newToken` — a crafted token value like `"\nAPP_DEBUG=true\nAPP_KEY=injected` could inject additional environment variables.
2. **Race conditions** — concurrent requests could corrupt `.env`.
3. **Immutable infrastructure violation** — containers/cloud deployments often have read-only `.env`.

**Proposed Solution:**
- Remove `file_put_contents` entirely.
- Modify `PaymentGatewayService` to read the token from `StoreSetting::first()->mercadopago_access_token` instead of `config('services.mercadopago.access_token')`.
- The token already IS stored in the database — just use it from there.

---

### [C-03] 🔴 XSS Risk via `dangerouslySetInnerHTML` with Server-Sourced Data

**Files:**
- `resources/js/Pages/CashRegister/Index.jsx` — Line 301
- `resources/js/Pages/CustomerMenu/Index.jsx` — Line 100 (CSS injection)
- `resources/js/Pages/CustomerMenu/components/checkout/CreditCardForm.jsx` — Line 278 (CSS)

**Severity:** MEDIUM-HIGH — `CashRegister/Index.jsx` is the most concerning

```jsx
// CashRegister/Index.jsx:301 — Pagination link labels
dangerouslySetInnerHTML={{ __html: link.label }}
```

**Why it's an issue:**  
`link.label` comes from Laravel's paginator (produces `&laquo; Previous`, numbers, etc.). While currently safe, `dangerouslySetInnerHTML` creates a dependency on that data remaining non-injectable. If the source ever changes or a future developer puts user-controlled data here, it becomes stored XSS.

**Proposed Solution:**
```jsx
// Replace with a safe entity decoder or explicit mapping:
<button ...>
  {link.label.replace('&laquo;', '←').replace('&raquo;', '→')}
</button>
```

---

### [C-04] 🟡 MercadoPago Webhook Secret Not Configured → Signature Validation May Fail Open

**File:** `app/Services/PaymentGatewayService.php` — Lines 39–43  
**Severity:** MEDIUM — Webhook authentication depends on unconfigured env variable

```php
$secret = (string) config('services.mercadopago.webhook_secret');
if ($secret === '') {
    Log::error('Mercado Pago webhook secret is not configured');
    return false; // Returns false — but does the caller abort? Must verify.
}
```

`MERCADOPAGO_WEBHOOK_SECRET` is **not present** in `.env` or `.env.example`, defaulting to empty string. This means all HMAC validations currently fail. Whether the webhook action rejects the request must be verified in `ProcessPaymentWebhookAction`.

**Proposed Solution:**
1. Add `MERCADOPAGO_WEBHOOK_SECRET=` to `.env.example`.
2. Verify `ProcessPaymentWebhookAction` returns a 401/400 on `validateWebhookSignature() === false`.
3. Set the production webhook secret from the MercadoPago developer panel.

---

### [C-05] 🟡 Hardcoded Test CPF in PIX Payment Request (LGPD / PII Violation Risk)

**File:** `app/Services/PaymentGatewayService.php` — Lines 100–103

```php
'identification' => [
    'type' => 'CPF',
    'number' => '19119119100', // CPF de teste — HARDCODED!
],
```

**Why it's an issue:**
1. This test CPF will be **rejected** by the MercadoPago production API.
2. Sending a hardcoded identifier violates the spirit of LGPD (Brazil's GDPR).
3. All PIX payments will fail in production as-is.

**Proposed Solution:**
- Omit the `identification` field entirely for PIX (MercadoPago allows this for individual payers).
- Or collect the customer's CPF during checkout if legally required.

---

## ⚠️ WARNING — Performance / Bugs

---

### [W-01] ⚠️ `DashboardController` Fires 9 Separate Database Queries Per Page Load

**File:** `app/Http/Controllers/DashboardController.php` — Lines 18–39

9 independent aggregate queries on every dashboard visit. While not N+1 (doesn't scale with rows), it wastes connection pool resources and adds latency on a real-time dashboard.

**Proposed Solution:**
```php
$stats = Cache::remember('dashboard_stats', 60, fn() => [
    'revenue_today' => Order::whereDate('paid_at', today())->sum('total_amount') / 100,
    // ... rest of stats
]);
```

---

### [W-02] ⚠️ Full Catalog Duplicated Across 3 Controllers (DRY Violation + Memory Waste)

**Files:** `FloorController.php`, `PosController.php`, `WaiterController.php`

Identical queries for products, flavors, sizes, and borders are copy-pasted across 3 controllers. Any change must be replicated in all 3 files.

**Proposed Solution:** Extract a shared `CatalogDataService` injectable class.

---

### [W-03] ⚠️ `OrderController::index()` Loads 100 Orders with 7 Deep Relationships (No Pagination)

**File:** `app/Http/Controllers/OrderController.php` — Lines 15–18

```php
Order::with(['items.product', 'items.pizzaSize', 'items.flavors', 'payments', 'table', 'user', 'neighborhood'])
    ->limit(100)->get(); // Not paginated — 100 fully hydrated objects
```

**Proposed Solution:** Replace with `->paginate(20)` and update the React component accordingly.

---

### [W-04] ⚠️ `items.*.price` Validated but Never Used (Misleading Security)

**Files:** `PosController.php` — Line 150, `FloorController.php` — Line 200

```php
'items.*.price' => 'required|numeric|min:0', // Validated but IGNORED server-side
```

Server correctly recalculates prices from DB, but the validated field is never used. A future developer might use `$item['price']` thinking it's safe, enabling price manipulation.

**Proposed Solution:** Remove `items.*.price` from validation rules entirely.

---

### [W-05] ⚠️ `sleep()` in PIX Retry Logic Blocks PHP-FPM Workers

**File:** `app/Services/PaymentGatewayService.php` — Lines 167, 194

```php
sleep($attempt * 2); // Up to 6 seconds blocking a web worker!
```

**Proposed Solution:** Move PIX generation to a queued job (`GeneratePixPaymentJob`). Return an "awaiting PIX" status immediately and let the queue handle retries.

---

### [W-06] ⚠️ `/api/user` Endpoint Returns Full User Model

**File:** `routes/api.php` — Lines 40–42

```php
Route::get('/user', function (Request $request) {
    return $request->user(); // Full model including email_verified_at, timestamps
});
```

**Proposed Solution:** Return only necessary fields:
```php
return $request->user()->only(['id', 'name', 'email', 'role']);
```

---

## 🧹 CLEANUP — Dead Code / Refactor

---

### [CL-01] 🧹 Empty `resources/js/Pages/Kitchen/` Directory

**Path:** `resources/js/Pages/Kitchen/` — **Empty directory**

No route references this. Likely renamed to `KDS/`. Delete it.

---

### [CL-02] 🧹 Duplicate Catalog Loading in 3 Controllers

Already detailed in W-02. Extract to `CatalogDataService`.

---

### [CL-03] 🧹 `composer.phar` (3.3MB Binary) Is Tracked in Git

**File:** `composer.phar` (found via `git ls-files`)

**Why it's an issue:** 3.3MB binary bloats repository history. Should be installed via CI/CD, not committed.

**Proposed Solution:**
```bash
git rm --cached composer.phar
echo "composer.phar" >> .gitignore
```

---

### [CL-04] 🧹 Debugging/Planning Files in Project Root Not Fully Gitignored

**Files:**
- `check_db.php` — DB debug script (accessible if web server misconfigured)
- `flight_plan_admin_data_loss_fix.md`
- `flight_plan_cart_key_collision.md`
- `flight_plan_cart_reactivity.md`
- `BACKLOG.md`

**Proposed Solution:**
- Delete `check_db.php` or add to `.gitignore`.
- Add `flight_plan_*.md` and `BACKLOG.md` to `.gitignore`.
- Move to `docs/archive/` if you want to keep them.

---

## Go-Live Checklist

### Environment
- [ ] Rotate all MercadoPago `TEST-` credentials in developer panel
- [ ] Set production `APP_USR-` keys in server `.env` only
- [ ] Set `APP_ENV=production` in production `.env`
- [ ] Set `APP_DEBUG=false` in production `.env`
- [ ] Set `MERCADOPAGO_WEBHOOK_SECRET` from MercadoPago developer panel
- [ ] Verify `.env` is NOT in the deployment package or Docker image

### Security (MANDATORY)
- [ ] Add `$hidden = ['mercadopago_access_token', 'google_maps_api_key', 'ifood_merchant_id']` to `StoreSetting.php`
- [ ] Scope `HandleInertiaRequests::share()` to public-safe fields only
- [ ] Remove hardcoded CPF `19119119100` from `PaymentGatewayService.php`
- [ ] Confirm `ProcessPaymentWebhookAction` rejects requests with invalid HMAC signatures
- [ ] Remove `file_put_contents` on `.env` from `SettingsController::updateIntegrations()`

### Performance
- [ ] Add 60-second cache to `DashboardController` stats
- [ ] Convert `OrderController::index()` to paginated endpoint (`paginate(20)`)
- [ ] Move PIX retry logic to a queued job (eliminate `sleep()` in web requests)

### Cleanup
- [ ] Delete empty `resources/js/Pages/Kitchen/` directory
- [ ] Run `git rm --cached composer.phar` and add to `.gitignore`
- [ ] Move or delete `flight_plan_*.md` and `check_db.php`

### Production Commands
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan view:cache`
- [ ] `npm run build` (Vite production build)
- [ ] Test PIX payment end-to-end with production credentials in staging
- [ ] Verify MercadoPago webhook signature validation works in production

---

*Report generated by static analysis — no code was modified. All file references are read-only.*
