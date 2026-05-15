# 🛠️ FLIGHT PLAN: REACT CART REACTIVITY FIX

## 1. Problem Identification
In the Customer Digital Menu, the `useCart` hook is instantiated independently by multiple components (e.g., `Index.jsx` for the floating cart button and `PizzaBuilderModal.jsx` for adding items). 

Because `useCart` uses local `useState` synchronized with `localStorage`, but lacks a shared React Context or internal event bus, these instances become decoupled. Adding an item in the Modal updates its own state and `localStorage`, but the `Index.jsx` instance remains stale because the native browser `storage` event does not fire within the same tab/window.

## 2. Proposed Architectural Fix
Instead of a heavy refactor to React Context which might disrupt Inertia's page lifecycle, we will implement a "Sync-on-Emit" pattern:
- **Emitter**: When `useCart` updates its internal state, it will dispatch a `local-cart-updated` CustomEvent.
- **Listener**: All instances of `useCart` will listen for this event and perform a non-recursive state synchronization with `localStorage`.

## 3. Implementation Steps
1. **Modify `resources/js/Pages/CustomerMenu/hooks/useCart.js`**:
    - Update the `useEffect` that handles persistence to dispatch `local-cart-updated`.
    - Update the `useEffect` that handles external synchronization to listen for `local-cart-updated`.
2. **Verification**:
    - Add an item via the Pizza Builder.
    - Confirm the "Ver Carrinho" button appears instantly in `Index.jsx` without F5.

## 4. Risks & Mitigations
- **Infinite Loops**: Mitigation: Use deep-equality checks (`JSON.stringify` comparison) before updating state or emitting events.
- **SSR Safety**: Mitigation: Wrap all `window` and `localStorage` calls in `typeof window !== 'undefined'` checks.
