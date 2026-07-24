import { useState, useMemo } from 'react';

export function useCheckoutMath({ activeOrders }) {
    // ── Inputs ──
    // Fee defaults to ON per Brazilian standard
    const [serviceFeeEnabled, setServiceFeeEnabled] = useState(true);
    const [discountValue, setDiscountValue] = useState(0); // In BRL or %
    const [discountMode, setDiscountMode] = useState('absolute'); // 'absolute' | 'percent'
    const [discountUnlocked, setDiscountUnlocked] = useState(false);
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorId, setSupervisorId] = useState(null);

    // ── Computed (useMemo) ──
    const subtotal = useMemo(
        () => activeOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
        [activeOrders]
    );

    const serviceFeeAmount = useMemo(
        () => (serviceFeeEnabled ? subtotal * 0.10 : 0),
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

    const resetDiscount = () => {
        setDiscountUnlocked(false);
        setDiscountValue(0);
        setSupervisorName('');
        setSupervisorId(null);
    };

    const applyDiscount = (value, mode, supervisorName, supervisorId) => {
        setDiscountUnlocked(true);
        setDiscountValue(value);
        setDiscountMode(mode);
        setSupervisorName(supervisorName);
        setSupervisorId(supervisorId);
    };

    return {
        subtotal,
        serviceFeeEnabled,
        setServiceFeeEnabled,
        serviceFeeAmount,
        discountValue,
        discountMode,
        discountUnlocked,
        discountAmount,
        supervisorName,
        supervisorId,
        applyDiscount,
        resetDiscount,
        grandTotal,
    };
}
