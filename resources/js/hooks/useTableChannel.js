import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

/**
 * useTableChannel — subscribes to a private 'tables.{tableId}' WebSocket channel
 * and triggers an Inertia partial reload when any order event fires for that table.
 *
 * Used by the Waiter App / Floor view to get per-table real-time updates.
 * Requires the user to be authenticated (private channel authorization).
 *
 * @param {string|null} tableId - The table UUID to listen to
 * @param {Object} options
 * @param {string[]} options.only - Inertia page props to reload, e.g. ['tables', 'stats']
 */
export function useTableChannel(tableId, { only = [] } = {}) {
    const handleReload = useCallback(() => {
        router.reload({
            only,
            preserveState: true,
            preserveScroll: true,
        });
    }, [only.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!window.Echo || !tableId) return;

        const channel = window.Echo.private(`tables.${tableId}`);

        channel
            .listen('.order.created', () => handleReload())
            .listen('.order.status.updated', () => handleReload());

        return () => {
            window.Echo.leaveChannel(`private-tables.${tableId}`);
        };
    }, [tableId, handleReload]);
}
