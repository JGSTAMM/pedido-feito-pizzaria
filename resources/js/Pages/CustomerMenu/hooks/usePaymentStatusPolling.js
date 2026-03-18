import { useEffect, useRef, useState } from 'react';
import { getOrderPaymentStatus } from '../services/customerMenuApi';

const POLLING_INTERVAL_MS = 5000;

function isTerminalStatus(status, paymentStatus, isPaid) {
    const normalizedStatus = String(status || '').toLowerCase();
    const normalizedPaymentStatus = String(paymentStatus || '').toLowerCase();

    if (isPaid) {
        return true;
    }

    return (
        normalizedStatus === 'paid' ||
        normalizedStatus === 'paid_online' ||
        normalizedStatus === 'accepted' ||
        normalizedStatus === 'rejected' ||
        normalizedPaymentStatus === 'approved' ||
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
                    paymentStatus: nextPaymentStatus,
                    isPaid: nextIsPaid,
                    pixQrCode: response?.pix_qr_code ?? null,
                    pixQrCodeBase64: response?.pix_qr_code_base64 ?? null,
                });

                if (!isTerminalStatus(nextStatus, nextPaymentStatus, nextIsPaid)) {
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
