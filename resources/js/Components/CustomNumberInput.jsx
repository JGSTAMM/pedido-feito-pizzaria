import React, { useState, useEffect, forwardRef } from 'react';

/**
 * CustomNumberInput - A premium glassmorphic number input with +/- buttons.
 * Supports manual typing, decimal steps, and automatic value sanitization.
 */
const CustomNumberInput = forwardRef(({ 
    value, 
    onChange, 
    min = 0, 
    max = 999999, 
    step = 1, 
    className = "",
    prefix = "",
    ...props 
}, ref) => {
    // Local state to handle typing smoothly (allows empty strings during deletion)
    const [inputValue, setInputValue] = useState(value);

    // Sync local state when prop changes externally (e.g., parent resets form)
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleDecrement = () => {
        const currentValue = parseFloat(value) || 0;
        const newValue = Math.max(min, Number((currentValue - step).toFixed(2)));
        onChange(newValue);
    };

    const handleIncrement = () => {
        const currentValue = parseFloat(value) || 0;
        const newValue = Math.min(max, Number((currentValue + step).toFixed(2)));
        onChange(newValue);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val); // Immediate UI feedback for typing
        
        // Propagate valid numbers to parent state (e.g., Inertia useForm)
        const numericVal = parseFloat(val);
        if (!isNaN(numericVal)) {
            // Keep it within bounds but allow the user to keep typing
            onChange(numericVal);
        }
    };

    const handleBlur = (e) => {
        let numericVal = parseFloat(inputValue);
        
        // Sanitize on blur
        if (isNaN(numericVal)) {
            numericVal = min;
        } else {
            numericVal = Math.min(max, Math.max(min, numericVal));
        }
        
        // Force precision and update both states
        const finalizedVal = Number(numericVal.toFixed(2));
        setInputValue(finalizedVal);
        onChange(finalizedVal);

        // Call original onBlur if provided
        if (props.onBlur) props.onBlur(e);
    };

    return (
        <div className={`flex items-center bg-surface border border-border-subtle rounded-xl overflow-hidden h-11 shadow-lg transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 min-w-[140px] ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={parseFloat(value) <= min}
                className="w-12 shrink-0 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed border-r border-border-subtle"
            >
                <span className="material-symbols-outlined text-lg select-none">remove</span>
            </button>
            
            <div className="flex-1 min-w-0 flex items-center px-4">
                {prefix && <span className="text-text-muted text-sm font-bold mr-2 select-none">{prefix}</span>}
                <input
                    {...props}
                    ref={ref}
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    step={step}
                    className="flex-1 w-full min-w-0 bg-transparent border-none text-center text-base font-bold text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                />
            </div>
            
            <button
                type="button"
                onClick={handleIncrement}
                disabled={parseFloat(value) >= max}
                className="w-12 shrink-0 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed border-l border-border-subtle"
            >
                <span className="material-symbols-outlined text-lg select-none">add</span>
            </button>
        </div>
    );
});

CustomNumberInput.displayName = 'CustomNumberInput';

export default CustomNumberInput;
