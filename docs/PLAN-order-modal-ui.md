# PLAN: Order Modal UI

## 🔍 The Root Cause
**1. The `{{count}}` Syntax Bug:**
The custom translation engine (`resources/js/hooks/useI18n.js`) is specifically designed to replace placeholders formatted with a colon prefix (e.g., `:count`, `:price`, `:total`). However, the translation files (`pt-BR.json`, `en-US.json`, `es-ES.json`) incorrectly contain strings using double curly braces (e.g., `{{count}} itens` and `{{price}} unid.`). When `useI18n` executes `replaceAll(':count', value)`, it fails to find `:count`, leaving the literal `{{count}}` in the UI.

**2. The Missing Split Payments Bug:**
The backend controller (`app/Http/Controllers/OrderController.php`) correctly eager-loads the `payments` relationship, but when mapping the data for the frontend, it forcefully plucks only the first payment method using `$order->payments->first()?->method`. It throws away the entire array, completely wiping out split payment data before it even reaches React.

---

## 🗺️ The Disconnect
**Current Broken JSX (`resources/js/Pages/Orders/Index.jsx`):**
```jsx
// Fails to interpolate due to translation dictionary mismatch
<h3 className="text-sm font-bold text-white mb-4">
    {t('orders.modal.itemsTitle', { count: order.items_count })}
</h3>

// Only renders a single method string
<span className="text-sm text-text-muted capitalize">{order.payment_method}</span>
```

**Current Backend Payload (`app/Http/Controllers/OrderController.php`):**
```php
// Throws away split payments!
'payment_method' => $order->payments->first()?->method ?? '-',
```

---

## 🛠️ The Proposed Solution

**Step 1: Fix Translation Syntax (Frontend Data)**
Update the translation JSON files (`pt-BR`, `es-ES`, `en-US`) to use the colon-prefixed placeholder syntax matching our `useI18n.js` engine.
- Replace `{{count}}` with `:count` in `itemsTitle`.
- Replace `{{price}}` with `:price` in `eachPrice`.
- Replace `{{filtered}}` and `{{total}}` with `:filtered` and `:total` in `showing`.

**Step 2: Expose Full Payment Array (Backend)**
Update `OrderController.php` to map the entire payments array instead of plucking the first element.
```php
// Replace 'payment_method' with the full array mapping
'payments' => $order->payments->map(fn($p) => [
    'method' => $p->method,
    'amount' => (float) $p->amount
]),
```

**Step 3: Refactor the Payment Footer (Frontend JSX)**
Update the footer section in `OrderDetailsModal` (`resources/js/Pages/Orders/Index.jsx`) to map over `order.payments` to elegantly display all split payments alongside their amounts.
```jsx
<div className="flex flex-col gap-2">
    {order.payments?.map((payment, idx) => (
        <div key={idx} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-text-muted text-[18px]">payments</span>
            <span className="text-sm text-text-muted capitalize">
                {payment.method} - {formatCurrency(payment.amount)}
            </span>
        </div>
    ))}
    {(!order.payments || order.payments.length === 0) && (
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-text-muted text-[18px]">payments</span>
            <span className="text-sm text-text-muted capitalize">Aguardando Pagamento</span>
        </div>
    )}
</div>
```
