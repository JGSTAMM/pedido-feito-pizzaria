import { useEffect, useRef, useState } from 'react';
import { getOrderPaymentStatus } from '../services/customerMenuApi';

const POLLING_INTERVAL_MS = 5000;

function isTerminalStatus(status, paymentStatus) {
    const normalizedStatus = String(status || '').toLowerCase();
    const normalizedPaymentStatus = String(paymentStatus || '').toLowerCase();

    // Polling only stops when the order reaches a final state
    // delivered: Order received by customer
    // completed: Final administrative closure
    // rejected: Rejected by establishment
    // cancelled: Cancelled by user/system
    return (
        ['delivered', 'completed', 'rejected', 'cancelled'].includes(normalizedStatus) ||
        normalizedPaymentStatus === 'rejected'
    );
}

export function usePaymentStatusPolling(orderId) {
    const [status, setStatus] = useState('awaiting_payment');
    const [paymentData, setPaymentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const timeoutRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const clearPollingTimeout = () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const poll = async () => {
            try {
                const response = await getOrderPaymentStatus(orderId);

                if (!mountedRef.current) {
                    return;
                }

                setError(null);

                const nextStatus = response?.status || 'awaiting_payment';
                const nextPaymentStatus = response?.payment_status || null;
                const nextIsPaid = Boolean(response?.is_paid);

                setStatus(nextStatus);
                setPaymentData({
                    orderId: response?.order_id,
                    orderCode: response?.order_code ?? null,
                    paymentStatus: nextPaymentStatus,
                    isPaid: nextIsPaid,
                    pixQrCode: response?.pix_qr_code ?? null,
                    pixQrCodeBase64: response?.pix_qr_code_base64 ?? null,
                    paymentMethodOnline: response?.payment_method_online ?? null,
                    type: response?.type ?? null,
                    customerName: response?.customer_name ?? null,
                });

                if (!isTerminalStatus(nextStatus, nextPaymentStatus)) {
                    timeoutRef.current = window.setTimeout(poll, POLLING_INTERVAL_MS);
                }
            } catch (requestError) {
                if (mountedRef.current) {
                    setError(requestError);
                    timeoutRef.current = window.setTimeout(poll, POLLING_INTERVAL_MS);
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);
        poll();

        return () => {
            mountedRef.current = false;
            clearPollingTimeout();
        };
    }, [orderId]);

    return {
        status,
        paymentData,
        isLoading,
        error,
    };
}
