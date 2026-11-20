import { useState, useMemo } from 'react';

export function useCheckoutMath({ activeOrders }) {
    // ── Inputs ──
    // Fee defaults to ON (10%) per Brazilian standard, customizable in % or BRL
    const [serviceFeeEnabled, setServiceFeeEnabled] = useState(true);
    const [serviceFeeMode, setServiceFeeMode] = useState('percent'); // 'percent' | 'absolute'
    const [serviceFeeValue, setServiceFeeValue] = useState(10);
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

    const serviceFeeAmount = useMemo(() => {
        if (!serviceFeeEnabled) return 0;
        const numeric = Math.max(0, Number(serviceFeeValue) || 0);
        if (serviceFeeMode === 'absolute') {
            return numeric;
        }
        return subtotal * (numeric / 100);
    }, [subtotal, serviceFeeEnabled, serviceFeeMode, serviceFeeValue]);

    const changeServiceFeeMode = (nextMode) => {
        if (nextMode === serviceFeeMode) return;
        const currentNumeric = Math.max(0, Number(serviceFeeValue) || 0);

        if (nextMode === 'absolute') {
            const brlEquivalent = Number((subtotal * (currentNumeric / 100)).toFixed(2));
            setServiceFeeValue(brlEquivalent);
        } else {
            const percentEquivalent = subtotal > 0
                ? Number(((currentNumeric / subtotal) * 100).toFixed(2))
                : 10;
            setServiceFeeValue(percentEquivalent);
        }

        setServiceFeeMode(nextMode);
        setServiceFeeEnabled(true);
    };

    const selectServiceFeePreset = (percent) => {
        setServiceFeeEnabled(true);
        setServiceFeeMode('percent');
        setServiceFeeValue(percent);
    };

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

    const applyDiscount = (value, mode, nextSupervisorName, nextSupervisorId) => {
        setDiscountUnlocked(true);
        setDiscountValue(value);
        setDiscountMode(mode);
        if (nextSupervisorName !== undefined && nextSupervisorName !== null) {
            setSupervisorName(nextSupervisorName);
        }
        if (nextSupervisorId !== undefined && nextSupervisorId !== null) {
            setSupervisorId(nextSupervisorId);
        }
    };

    return {
        subtotal,
        serviceFeeEnabled,
        setServiceFeeEnabled,
        serviceFeeMode,
        setServiceFeeMode,
        serviceFeeValue,
        setServiceFeeValue,
        changeServiceFeeMode,
        selectServiceFeePreset,
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
