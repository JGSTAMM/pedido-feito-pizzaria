# 🛠️ FLIGHT PLAN: CART KEY COLLISION RESOLUTION

## 1. Problem Identification
In the Customer Digital Menu, adding the exact same custom pizza twice as separate actions results in a React key collision warning: `Encountered two children with the same key`. 

This occurs because:
- `PizzaBuilderModal.jsx` generates a deterministic `customPizzaId` based on size and flavors (excluding borders and timestamps).
- `useCart.js` explicitly disables item merging for pizzas, resulting in multiple items in the cart with identical IDs.
- **Destructive Mutation Bug**: Because `useCart`'s `updateQuantity` and `removeItem` functions filter/map by `id`, clicking "+" or "Remove" on one pizza accidentally modifies or deletes all pizzas sharing that ID.

## 2. Proposed Architectural Fix (Option B)
We will transition from deterministic IDs to **Instance-Unique IDs** for pizzas. By appending a timestamp to the generated ID, we ensure each "Adicionar ao Carrinho" action creates a unique line item.

## 3. Implementation Steps
1. **Modify `resources/js/Pages/CustomerMenu/components/menu/PizzaBuilderModal.jsx`**:
    - Locate the `addCustomPizzaToCart` function.
    - Append `-${Date.now()}` to the `customPizzaId` string.
2. **Audit other complex objects**:
    - Check if any other modal (e.g., standard product detail modal) uses deterministic IDs that skip merging.
3. **Verification**:
    - Add two identical pizzas.
    - Confirm separate rows in the cart.
    - Confirm clicking "+" on one does not affect the other.

## 4. Backend Safety
- Verified `useCheckout.js` maps `product_id: undefined` for pizzas.
- The backend relies on structured `flavor_ids` and `pizza_size_id` payloads, ignoring the frontend string ID entirely.
