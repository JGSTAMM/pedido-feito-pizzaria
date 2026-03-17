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

        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = useCallback((product, quantity = 1) => {
        const parsedQuantity = Math.max(1, Math.floor(toNumber(quantity)));

        setItems((currentItems) => {
            const productId = product.id;
            const existingItem = currentItems.find((item) => item.id === productId);

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
                    id: productId,
                    name: product.name,
                    price: toNumber(product.price),
                    imageUrl: product.image_url ?? null,
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
