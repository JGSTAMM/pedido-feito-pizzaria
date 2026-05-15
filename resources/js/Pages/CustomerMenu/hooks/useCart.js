import { useCallback, useEffect, useMemo, useState } from 'react';

const CART_STORAGE_KEY = 'customer-menu-cart-v1';

function readCartFromStorage() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);

        if (!storedValue) {
            return [];
        }

        const parsed = JSON.parse(storedValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function toNumber(value) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function useCart() {
    const [items, setItems] = useState(readCartFromStorage);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const currentStored = window.localStorage.getItem(CART_STORAGE_KEY);
        const nextStored = JSON.stringify(items);

        // Only update and emit if actual changes occurred to prevent infinite loops
        if (currentStored !== nextStored) {
            window.localStorage.setItem(CART_STORAGE_KEY, nextStored);
            window.dispatchEvent(new CustomEvent('local-cart-updated'));
        }
    }, [items]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncWithStorage = () => {
            const stored = readCartFromStorage();
            setItems(current => {
                if (JSON.stringify(current) !== JSON.stringify(stored)) {
                    return stored;
                }
                return current;
            });
        };

        // Sync immediately on mount to catch Inertia cached state mismatches
        syncWithStorage();

        window.addEventListener('popstate', syncWithStorage);
        window.addEventListener('focus', syncWithStorage);
        window.addEventListener('local-cart-updated', syncWithStorage);

        return () => {
            window.removeEventListener('popstate', syncWithStorage);
            window.removeEventListener('focus', syncWithStorage);
            window.removeEventListener('local-cart-updated', syncWithStorage);
        };
    }, []);

    const addItem = useCallback((product, quantity = 1) => {
        const parsedQuantity = Math.max(1, Math.floor(toNumber(quantity)));

        setItems((currentItems) => {
            const productId = product.id;
            const isPizza = product.type === 'pizza';

            // Regular products merge by id AND observation (for variations)
            const existingItem = !isPizza
                ? currentItems.find((item) => item.id === productId && item.observation === product.observation)
                : null;

            if (existingItem) {
                return currentItems.map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity + parsedQuantity }
                        : item
                );
            }

            return [
                ...currentItems,
                {
                    ...product,
                    id: productId,
                    name: product.name,
                    price: toNumber(product.price),
                    imageUrl: product.image_url ?? product.imageUrl ?? null,
                    observation: product.observation ?? null,
                    quantity: parsedQuantity,
                },
            ];
        });
    }, []);

    const removeItem = useCallback((itemId) => {
        setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId, nextQuantity) => {
        const parsedQuantity = Math.floor(toNumber(nextQuantity));

        setItems((currentItems) => {
            if (parsedQuantity <= 0) {
                return currentItems.filter((item) => item.id !== itemId);
            }

            return currentItems.map((item) =>
                item.id === itemId ? { ...item, quantity: parsedQuantity } : item
            );
        });
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const cartTotal = useMemo(() => {
        return items.reduce((total, item) => total + toNumber(item.price) * item.quantity, 0);
    }, [items]);

    const cartItemCount = useMemo(() => {
        return items.reduce((total, item) => total + item.quantity, 0);
    }, [items]);

    return {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
    };
}
