# 🏗️ WAITER CHECKOUT PLAN — Enterprise-Grade Bill Closing

> **Status:** PLANNING · No code modifications  
> **Component:** `TableOrderDrawer.jsx` (1432 lines)  
> **Consumers:** `Floor/Index.jsx` (desktop) · `Waiter/Index.jsx` (mobile)  
> **Backend Route:** `POST /floor/{table}/pay` → `FloorController@payAndClose`  
> **Date:** 2026-07-20

---

## 📊 Current State Analysis

### The Problem: A God Component

`TableOrderDrawer.jsx` is a **1432-line monolith** that handles ALL of these concerns in one file:

| Concern | Lines (approx.) | State Variables |
|---------|-----------------|----------------|
| Cart management (add/remove items) | ~200 | `cart`, `searchTerm`, `activeCategory`, `isCartOpen` |
| Pizza Builder orchestration | ~30 | `showPizzaBuilder`, `initialPizzaFlavor` |
| Product Variation modal | ~30 | `showVariationModal`, `productToVariate` |
| Quick Item observation modal | ~80 | `selectedQuickItem`, `quickObservation` |
| Checkout modal + split payments | ~350 | `showCheckoutModal`, `checkoutPaymentMethod`, `payments`, `paymentInputValue`, `checkingOut` |
| PIX QR code lifecycle | ~250 | 12 state variables (!) for generating, polling, countdown, fullscreen |

> ⚠️ **WARNING:** The checkout modal alone is ~350 lines of JSX inlined inside the drawer. It has no service fee, no discount, no calculator — and it's already complex. Adding 4 new features directly would push this past 2000 lines.

### How `total_amount` Flows Today

```
┌──────────────────────────────────────────────────────────────────┐
│ FRONTEND (TableOrderDrawer.jsx)                                  │
│                                                                  │
│ tableTotal = activeOrders.reduce(                                │
│   (sum, o) => sum + Number(o.total), 0                           │
│ )  // ← Float (BRL), e.g., 89.50                                │
│                                                                  │
│ payments[] = [{ method: 'dinheiro', amount: 89.50 }, ...]        │
│                                                                  │
│ handleCheckout() → Math.round(p.amount * 100) → CENTS integer   │
│                     ↓                                            │
│ POST /floor/{table}/pay  { payments: [{ method, amount: 8950 }]} │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND (FloorController@payAndClose)                            │
│                                                                  │
│ Validates: payments.*.amount = required|integer|min:0             │
│ totalAmount = orders.sum(getRawOriginal('total_amount'))  // CENTS│
│ Compares totalPaid >= totalAmount (integer cents)                 │
│ Creates Payment records with amount / 100 (back to float)        │
└──────────────────────────────────────────────────────────────────┘
```

> ❗ **IMPORTANT — Math-in-Cents Architecture:** The backend already stores and validates in **integer cents**. The frontend does `Math.round(amount * 100)` at the last moment before POST. Our new features (fee, discount) MUST follow this same pattern — compute everything as floats for display, convert to cents only at submission.

### What's Missing for Enterprise Checkout

| Feature | Status | Notes |
|---------|--------|-------|
| 📋 Itemized consumption conference | ❌ Missing | Orders are shown but no "bill check" view for the customer |
| 💰 10% Service Fee toggle | ❌ Missing | No concept of service fee anywhere in codebase |
| 🔒 Supervisor PIN for discounts | ❌ Missing | No PIN/discount logic exists |
| 🧮 Calculator widget | ❌ Missing | Waiter has no built-in calculator |
| 💳 Split payments | ✅ Exists | Already supports PIX/Dinheiro/Crédito/Débito split |
| 🏧 Mercado Pago Point API | ❌ Not started | No references found. Future integration target |

---

## 🗺️ Component Structure

### Proposed Architecture: Extract & Compose

Instead of continuing to bloat the monolith, we extract the **checkout flow** into its own component tree:

```
TableOrderDrawer.jsx (SIMPLIFIED — ~800 lines after extraction)
├── Tab 1: Account View (existing order list + "Close Account" CTA)
├── Tab 2: Add Items (catalog, pizza builder, etc.)
├── Cart Sheet (existing bottom sheet)
│
└── NEW ↓↓↓ Triggered by "Close Account" button
    │
    CheckoutModal.jsx (NEW — ~400 lines)
    ├── <BillConference />          — Itemized list of all items
    ├── <ServiceFeeToggle />        — 10% fee switch
    ├── <DiscountSection />          — Locked input + PIN trigger
    │   └── <SupervisorPinModal />   — PIN entry overlay
    ├── <CheckoutSummary />          — Subtotal / Fee / Discount / TOTAL
    ├── <PaymentMethodGrid />        — Existing method buttons (extracted)
    ├── <PaymentAmountInput />       — CustomNumberInput + Add button
    ├── <PaymentsList />             — Added payments list
    ├── <PixPaymentFlow />           — Full PIX lifecycle (extracted ~250 lines)
    └── <CheckoutActions />          — Print / Finalize buttons
    
CalculatorPopover.jsx (NEW — ~150 lines)
└── Floating popover accessible from checkout view
```

### Component Breakdown

#### 1. `CheckoutModal.jsx` — The New Orchestrator

**Purpose:** Owns the entire bill-closing flow. Replaces the inline `{showCheckoutModal && ...}` block (lines 1009–1356).

**Props:**
```
table, activeOrder, activeOrders, tableTotal,
isOpen, onClose, onCheckoutComplete, formatCurrency, t
```

**Why extract?** The checkout modal is a self-contained flow with its own state machine (default → PIX flow → approved). Extracting it removes ~400 lines and all 12+ PIX state variables from the parent.

#### 2. `BillConference.jsx` — Consumption Review

**Purpose:** Displays a clean, receipt-style itemized list of ALL items across all active orders. This is the "conferência de consumo" the customer sees before paying.

**Layout:**
```
┌─────────────────────────────────────────┐
│  📋 CONFERÊNCIA DE CONSUMO              │
│─────────────────────────────────────────│
│  Pedido #A1B2C — 19:42                  │
│    2x  Coca-Cola 350ml         R$ 14,00 │
│    1x  Pizza Bacon (G)         R$ 52,00 │
│        → 1/2 Bacon, 1/2 Calabresa       │
│        → Borda: Catupiry                 │
│        → ⚠️ SEM CEBOLA                  │
│                                          │
│  Pedido #D3E4F — 20:15                  │
│    3x  Água Mineral            R$  9,00 │
│─────────────────────────────────────────│
│  SUBTOTAL                      R$ 75,00 │
└─────────────────────────────────────────┘
```

**Key decisions:**
- Reuses the same order item rendering logic from the "account" tab but in a **compact, read-only** format
- Grouped by order (each with its `short_code` and timestamp)
- Shows observations, pizza flavors, and borders inline

#### 3. `ServiceFeeToggle.jsx` — 10% Service Fee

**Purpose:** A toggle switch that dynamically adds/removes a 10% service fee.

**Layout:**
```
┌─────────────────────────────────────────┐
│  🍽️ Taxa de Serviço (10%)      [  ON ] │
│     + R$ 7,50                            │
└─────────────────────────────────────────┘
```

**Behavior:**
- Default: **OFF** (configurable via store settings in the future)
- When toggled ON: `fee = subtotal * 0.10`
- Visual: Animated toggle (like iOS switch) with the fee amount appearing/fading
- The fee amount updates in real-time as the subtotal changes

#### 4. `DiscountSection.jsx` + `SupervisorPinModal.jsx` — PIN-Locked Discount

**Purpose:** A discount field that is **grayed out and locked by default**. Tapping the lock icon opens the `SupervisorPinModal`.

**Layout (Locked):**
```
┌─────────────────────────────────────────┐
│  🔒 Desconto                   [LOCKED] │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  "Requer PIN de supervisor"              │
└─────────────────────────────────────────┘
```

**Layout (Unlocked):**
```
┌─────────────────────────────────────────┐
│  🔓 Desconto (Aprovado: Maria)  [CLEAR] │
│  [R$] [___15.00___]  ou  [%] [___20%__] │
│  - R$ 15,00                              │
└─────────────────────────────────────────┘
```

**Behavior:**
- Locked by default, visually grayed out
- Tap lock → Opens `SupervisorPinModal`
- After valid PIN → Unlocks with supervisor name displayed
- Supports both **absolute (R$)** and **percentage (%)** discount modes
- "CLEAR" button re-locks the field and removes the discount

#### 5. `SupervisorPinModal.jsx` — PIN Entry

**Layout:**
```
┌─────────────────────────────────────┐
│       🔐 PIN DO SUPERVISOR          │
│                                      │
│  Para aplicar desconto, insira o     │
│  PIN de um supervisor autorizado.    │
│                                      │
│         ● ● ● ●  (4 digits)         │
│                                      │
│     [1] [2] [3]                      │
│     [4] [5] [6]                      │
│     [7] [8] [9]                      │
│     [⌫] [0] [✓]                     │
│                                      │
│     ❌ PIN Inválido (shake anim)     │
└─────────────────────────────────────┘
```

**Key decisions:** See the Security section below for PIN validation strategy.

#### 6. `CalculatorPopover.jsx` — Waiter Calculator

**Purpose:** A floating calculator accessible via a FAB (Floating Action Button) in the checkout view.

**Layout:**
```
┌────────────────────────┐
│  🧮 Calculadora         │
│ ┌──────────────────────┐│
│ │              245.50  ││
│ └──────────────────────┘│
│  [C] [÷]  [×]  [⌫]     │
│  [7] [8]  [9]  [−]     │
│  [4] [5]  [6]  [+]     │
│  [1] [2]  [3]  [=]     │
│  [0] [00] [.]  [USE]   │
│                          │
│  [USE] → Inserts result  │
│  into payment amount     │
└────────────────────────┘
```

**Behavior:**
- Opens as a **popover/bottom-sheet** (not a modal that blocks the checkout)
- The "USE" button pastes the result into the `paymentInputValue` field
- Standard arithmetic: `+`, `-`, `×`, `÷`
- Use case: Customer says "split R$245.50 between 3 people" → Waiter types `245.50 ÷ 3 = 81.83` → Presses USE

#### 7. `CheckoutSummary.jsx` — The Math Dashboard

**Purpose:** Replaces the current "Summary Dashboard" grid. Shows the complete bill breakdown.

**Layout:**
```
┌─────────────────────────────────────────┐
│  SUBTOTAL                      R$ 75,00 │
│  + Taxa de Serviço (10%)       R$  7,50 │
│  − Desconto (Supervisor: Maria)R$ 10,00 │
│─────────────────────────────────────────│
│  ██ TOTAL A PAGAR ██           R$ 72,50 │
│─────────────────────────────────────────│
│  Pago                          R$ 50,00 │
│  Restante                      R$ 22,50 │
│  Troco                         R$  0,00 │
└─────────────────────────────────────────┘
```

---

## 🧮 State Management

### Custom Hook: `useCheckoutMath()`

All checkout math lives in a single, testable custom hook:

```javascript
function useCheckoutMath({ activeOrders }) {
  // ── Inputs ──
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);        // In BRL
  const [discountMode, setDiscountMode] = useState('absolute');  // 'absolute' | 'percent'
  const [discountUnlocked, setDiscountUnlocked] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');

  // ── Computed (useMemo) ──
  const subtotal = useMemo(
    () => activeOrders.reduce((s, o) => s + Number(o.total), 0),
    [activeOrders]
  );

  const serviceFeeAmount = useMemo(
    () => serviceFeeEnabled ? subtotal * 0.10 : 0,
    [subtotal, serviceFeeEnabled]
  );

  const discountAmount = useMemo(() => {
    if (!discountUnlocked) return 0;
    if (discountMode === 'percent') {
      return (subtotal + serviceFeeAmount) * (discountValue / 100);
    }
    return discountValue;
  }, [subtotal, serviceFeeAmount, discountValue, discountMode, discountUnlocked]);

  const grandTotal = useMemo(
    () => Math.max(0, subtotal + serviceFeeAmount - discountAmount),
    [subtotal, serviceFeeAmount, discountAmount]
  );

  // Return all values + setters
}
```

### State Flow

```
activeOrders (DB) → subtotal
                       ↓
              serviceFeeEnabled? → YES → +10% fee
                       ↓                    ↓
                  subtotal + fee ←──────────┘
                       ↓
              discountUnlocked? → YES → - discount
                       ↓                    ↓
                  grandTotal ←──────────────┘
                       ↓
              Split Payment UI
                       ↓
              payments[] array
                       ↓
              totalPaid >= grandTotal? → Enable "Finalize" button
```

### Critical: The Cents Conversion Boundary

> 🔴 **CAUTION:** All internal math uses **floats in BRL** for display accuracy. The **only** conversion to cents happens in `handleCheckout()` at the moment of POST:
> ```javascript
> payments.map(p => ({
>   method: p.method,
>   amount: Math.round(Number(p.amount) * 100)  // BRL → cents
> }))
> ```
> The service fee and discount are factored into `grandTotal`, which replaces `tableTotal` as the target amount for the split payment logic. The backend still receives `payments.*.amount` as **integer cents** — but NOW it also receives `service_fee_cents` and `discount_cents` for auditability.

### Backend Impact Assessment

| Area | Impact | Detail |
|------|--------|--------|
| `FloorController@payAndClose` | **Moderate** | Must accept optional `service_fee_cents`, `discount_cents`, `discount_supervisor_id`. Backend recalculates expected total: `order_total + fee - discount` and validates `totalPaid >= expectedTotal`. |
| `PayAndCloseTableAction` | **Needs update** | Must accept and forward fee/discount fields. |
| `Order` model | **Needs migration** | Add nullable columns: `service_fee_amount`, `discount_amount`, `discount_approved_by` |
| `ReceiptPrint.jsx` | **Needs update** | Must render fee and discount lines on the printed receipt |
| `Payment` model | **No change** | Payments remain as-is (method + amount) |

---

## 🔒 Security Logic — Supervisor PIN

### Decision: Backend Validation (Recommended)

| Approach | Pros | Cons |
|----------|------|------|
| **Frontend-only hash** | Fast, offline-capable | PIN stored in JS, easily bypassed via DevTools |
| **Backend validation** ✅ | Secure, auditable, PIN never exposed to client | Requires network call (adds ~200ms latency) |
| **Hybrid (hash + backend)** | Offline fallback | Complex, still requires backend for audit |

**Recommendation: Backend validation.** This is a financial control. A waiter with DevTools could bypass a frontend-only check.

### Implementation Flow

```
1. Waiter taps 🔒 lock icon
2. SupervisorPinModal opens (numpad overlay)
3. Waiter enters 4-digit PIN
4. Frontend sends: POST /floor/validate-supervisor-pin { pin: "1234" }
5. Backend:
   - Hashes the PIN
   - Looks up: SELECT * FROM users WHERE pin_hash = hash("1234") AND role IN ('admin','supervisor')
   - If found → Returns { valid: true, supervisor_name: "Maria", supervisor_id: 5 }
   - If not found → Returns { valid: false }
6. Frontend:
   - If valid → Unlocks discount field, shows "Aprovado: Maria"
   - If invalid → Shake animation, "PIN Inválido"
```

### Backend Requirements (New Route)

```
POST /floor/validate-supervisor-pin
Body: { pin: string }
Response: { valid: boolean, supervisor_name?: string, supervisor_id?: number }
```

**Database:** Add a `pin_hash` column to the `users` table (nullable, bcrypt). Only admin/supervisor roles can have a PIN set.

### Audit Trail

When a discount is applied and the table is closed, the `handleCheckout` payload should include:

```json
{
  "payments": [...],
  "service_fee_cents": 750,
  "discount_cents": 1500,
  "discount_supervisor_id": 5
}
```

This gets stored on the order record for reporting and accountability.

---

## 💳 Future Integration — Mercado Pago Point API

### Current State

- **PIX via Mercado Pago:** Already integrated (`generatePixPayment` → `POST /floor/{table}/generate-pix`)
- **Point API / Deep Link:** Not started. No references in codebase.

### Where to Hook In

The Point API integration will be triggered from the **Payment Method Grid** as a new method:

```
Payment Methods:
  [Dinheiro] [PIX] [Crédito] [Débito] [🏧 Maquininha MP] ← NEW
```

### Integration Points in the Component Tree

```
CheckoutModal.jsx
├── PaymentMethodGrid.jsx
│   └── NEW: { method: 'mp_point', icon: 'contactless', label: 'Maquininha' }
│
├── When mp_point selected + amount entered + "Add" pressed:
│   └── NEW: MpPointPaymentFlow.jsx (similar to PixPaymentFlow.jsx)
│       ├── Calls: POST /floor/{table}/create-point-payment { amount, description }
│       │   └── Backend: Uses MP Point API to create a payment intent
│       │       → Returns: { payment_intent_id, deep_link_url }
│       │
│       ├── Option A: Deep Link (Mobile)
│       │   └── window.location.href = deep_link_url
│       │   └── Opens Mercado Pago app on the POS device
│       │
│       ├── Option B: API Polling (Desktop/Terminal)
│       │   └── Poll GET /floor/point-status/{payment_intent_id} every 5s
│       │   └── Same pattern as PIX polling (reuse polling hook)
│       │
│       └── On approved → Auto-add to payments[] → Close if fully paid
```

### Architecture Note

> 💡 **TIP:** The PIX flow already established the pattern: **generate payment → show status → poll for approval → auto-add to payments[].** The Point API integration should follow the **exact same state machine** pattern but with a different backend endpoint and a deep link trigger instead of a QR code. Consider extracting a shared `usePaymentPolling(endpoint, paymentId)` hook that both PIX and Point flows can reuse.

---

## 📋 Task Breakdown

### Phase 1: Extract & Refactor (No New Features)

- [ ] **Task 1.1:** Create `CheckoutModal.jsx` — Move lines 1009-1356 from `TableOrderDrawer.jsx` into a new component. Wire props. Verify identical behavior.
- [ ] **Task 1.2:** Extract `PixPaymentFlow.jsx` — Move all 12 PIX state variables and the QR code UI into its own component inside `CheckoutModal`.
- [ ] **Task 1.3:** Extract `PaymentMethodGrid.jsx`, `PaymentAmountInput.jsx`, `PaymentsList.jsx`, `CheckoutActions.jsx` as small, focused components.
- [ ] **Task 1.4:** Verify: Floor desktop + Waiter mobile both still work identically. Manual test all payment methods.

### Phase 2: New Features

- [ ] **Task 2.1:** Create `useCheckoutMath()` hook with `subtotal`, `serviceFeeAmount`, `discountAmount`, `grandTotal`.
- [ ] **Task 2.2:** Create `BillConference.jsx` — Itemized receipt-style list.
- [ ] **Task 2.3:** Create `ServiceFeeToggle.jsx` — Toggle switch with animated fee display.
- [ ] **Task 2.4:** Create `DiscountSection.jsx` + `SupervisorPinModal.jsx` — Locked field + numpad.
- [ ] **Task 2.5:** Backend: Add `POST /floor/validate-supervisor-pin` route + `pin_hash` migration.
- [ ] **Task 2.6:** Create `CheckoutSummary.jsx` — Replaces the 3-card grid with full breakdown.
- [ ] **Task 2.7:** Create `CalculatorPopover.jsx` — Floating calculator with "USE" button.

### Phase 3: Backend & Data Layer

- [ ] **Task 3.1:** Migration: Add `service_fee_amount`, `discount_amount`, `discount_approved_by` to `orders` table.
- [ ] **Task 3.2:** Update `FloorController@payAndClose` to accept and store `service_fee_cents`, `discount_cents`, `discount_supervisor_id`.
- [ ] **Task 3.3:** Update `ReceiptPrint.jsx` to display fee and discount lines.
- [ ] **Task 3.4:** Update `PayAndCloseTableAction` for the API-based checkout flow.

### Phase 4: i18n

- [ ] **Task 4.1:** Add all new translation keys to `pt-BR.json`, `en-US.json`, `es-ES.json`:
  - `floor.drawer.checkout.bill_conference_title`
  - `floor.drawer.checkout.service_fee_label`
  - `floor.drawer.checkout.service_fee_toggle`
  - `floor.drawer.checkout.discount_label`
  - `floor.drawer.checkout.discount_locked_hint`
  - `floor.drawer.checkout.discount_approved_by`
  - `floor.drawer.checkout.supervisor_pin_title`
  - `floor.drawer.checkout.supervisor_pin_subtitle`
  - `floor.drawer.checkout.supervisor_pin_invalid`
  - `floor.drawer.checkout.calculator_title`
  - `floor.drawer.checkout.calculator_use`
  - `floor.drawer.checkout.subtotal_label`
  - `floor.drawer.checkout.grand_total_label`

### Phase X: Verification

- [ ] **V1:** Desktop Floor: Open table → View account → Close account → Verify bill conference shows all items
- [ ] **V2:** Toggle service fee ON/OFF → Verify total updates in real-time
- [ ] **V3:** Tap discount lock → Enter wrong PIN → Verify shake + error
- [ ] **V4:** Enter correct PIN → Apply R$ discount → Verify total
- [ ] **V5:** Enter correct PIN → Apply % discount → Verify total
- [ ] **V6:** Open calculator → Compute split → Press USE → Verify value populates amount field
- [ ] **V7:** Split payment (PIX + Dinheiro) → Verify full flow still works
- [ ] **V8:** Mobile Waiter: Repeat V1-V7 on mobile viewport
- [ ] **V9:** Print receipt → Verify fee and discount appear on paper
- [ ] **V10:** Check all 3 i18n locales (PT/EN/ES) for missing keys

---

## 📐 File Size Targets

| File | Current Lines | Target Lines |
|------|--------------|--------------|
| `TableOrderDrawer.jsx` | 1432 | ~800 (after checkout extraction) |
| `CheckoutModal.jsx` | — | ~250 (orchestrator only) |
| `PixPaymentFlow.jsx` | — | ~200 |
| `BillConference.jsx` | — | ~80 |
| `ServiceFeeToggle.jsx` | — | ~40 |
| `DiscountSection.jsx` | — | ~80 |
| `SupervisorPinModal.jsx` | — | ~120 |
| `CheckoutSummary.jsx` | — | ~60 |
| `CalculatorPopover.jsx` | — | ~150 |
| `useCheckoutMath.js` | — | ~50 |

**Net result:** The same total code, but distributed across focused, testable files with clear responsibilities.

---

> **NOTE:** This plan is strictly a **read-only analysis**. No code was modified. Implementation should follow the phase order above: extract first, then add features, then update backend, then verify.
