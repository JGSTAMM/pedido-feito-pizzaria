import React, { useState, useEffect } from 'react';

/**
 * 24-Hour Time Input Component (HH:mm)
 * Enforces strict 24-hour time format across all browsers and locales,
 * preventing browser-specific 12-hour (AM/PM) rendering.
 */
export default function TimeInput24({
    value = '',
    onChange,
    className = '',
    id,
    name,
    placeholder = '00:00',
    disabled = false
}) {
    const normalize = (val) => {
        if (!val) return '';
        const s = String(val).trim();
        return s.length > 5 ? s.slice(0, 5) : s;
    };

    const [displayValue, setDisplayValue] = useState(normalize(value));

    useEffect(() => {
        setDisplayValue(normalize(value));
    }, [value]);

    const handleChange = (e) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '').slice(0, 4);

        let formatted = digits;
        if (digits.length >= 3) {
            formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
        } else if (digits.length === 2 && input.length > displayValue.length) {
            formatted = `${digits}:`;
        }

        setDisplayValue(formatted);

        // When 4 digits are entered, immediately validate and propagate
        if (digits.length === 4) {
            let h = parseInt(digits.slice(0, 2), 10);
            let m = parseInt(digits.slice(2, 4), 10);
            if (h > 23) h = 23;
            if (m > 59) m = 59;
            const valid = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            setDisplayValue(valid);
            if (onChange) onChange(valid);
        } else if (digits.length === 0) {
            if (onChange) onChange('');
        }
    };

    const handleBlur = () => {
        const digits = displayValue.replace(/\D/g, '');
        if (!digits) {
            setDisplayValue('');
            if (onChange) onChange('');
            return;
        }

        let h = 0;
        let m = 0;

        if (digits.length === 1 || digits.length === 2) {
            h = parseInt(digits, 10);
            m = 0;
        } else if (digits.length === 3) {
            h = parseInt(digits.slice(0, 2), 10);
            m = parseInt(digits.slice(2) + '0', 10);
        } else {
            h = parseInt(digits.slice(0, 2), 10);
            m = parseInt(digits.slice(2, 4), 10);
        }

        if (isNaN(h) || h < 0) h = 0;
        if (h > 23) h = 23;
        if (isNaN(m) || m < 0) m = 0;
        if (m > 59) m = 59;

        const finalVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        setDisplayValue(finalVal);
        if (onChange) onChange(finalVal);
    };

    return (
        <div className="relative inline-flex items-center">
            <input
                id={id}
                name={name}
                type="text"
                inputMode="numeric"
                maxLength={5}
                disabled={disabled}
                placeholder={placeholder}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={className || "w-28 bg-surface border border-border-subtle rounded-lg pl-3 pr-8 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-muted/40"}
            />
            <span className="material-symbols-outlined text-[16px] text-text-muted absolute right-2.5 pointer-events-none select-none">
                schedule
            </span>
        </div>
    );
}
