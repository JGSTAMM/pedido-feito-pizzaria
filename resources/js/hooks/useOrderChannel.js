import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

/**
 * useOrderChannel — subscribes to the public 'orders' WebSocket channel
 * and triggers an Inertia partial reload when any order event fires.
 *
 * Replaces the manual F5 / "polling every 10s" anti-pattern.
 * Works for KDS (orders + counts) and Floor (tables + stats).
 *
 * @param {Object} options
 * @param {string[]} options.only     - Inertia page props to reload, e.g. ['orders', 'counts']
 * @param {Function} [options.onEvent] - Optional callback: (eventName, payload) => void
 */
export function useOrderChannel({ only = [], onEvent } = {}) {
    const handleReload = useCallback(() => {
        router.reload({
            only,
            preserveState: true,
            preserveScroll: true,
        });
    }, [only.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.channel('orders');

        channel
            .listen('.order.created', (e) => {
                onEvent?.('created', e);
                handleReload();
            })
            .listen('.order.status.updated', (e) => {
                onEvent?.('statusUpdated', e);
                handleReload();
            });

        return () => {
            window.Echo.leaveChannel('orders');
        };
    }, [handleReload, onEvent]);
}
