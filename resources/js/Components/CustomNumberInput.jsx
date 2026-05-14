import React from 'react';

/**
 * CustomNumberInput - A premium glassmorphic number input with +/- buttons.
 * 
 * @param {Object} props
 * @param {number|string} props.value - The current value
 * @param {function} props.onChange - Callback function for value changes
 * @param {number} props.min - Minimum value (default: 1)
 * @param {number} props.max - Maximum value (default: 100)
 * @param {number} props.step - Increment/decrement step (default: 1)
 */
const CustomNumberInput = ({ value, onChange, min = 1, max = 100, step = 1 }) => {
    const handleDecrement = () => {
        const currentValue = parseInt(value) || 0;
        const newValue = Math.max(min, currentValue - step);
        onChange(newValue);
    };

    const handleIncrement = () => {
        const currentValue = parseInt(value) || 0;
        const newValue = Math.min(max, currentValue + step);
        onChange(newValue);
    };

    return (
        <div className="flex items-center bg-surface border border-border-subtle rounded-xl overflow-hidden h-11 shadow-lg transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={parseInt(value) <= min}
                className="w-12 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed border-r border-border-subtle"
            >
                <span className="material-symbols-outlined text-lg select-none">remove</span>
            </button>
            
            <input
                type="number"
                value={value}
                readOnly
                className="flex-1 bg-transparent border-none text-center text-base font-bold text-white focus:ring-0 cursor-default [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            
            <button
                type="button"
                onClick={handleIncrement}
                disabled={parseInt(value) >= max}
                className="w-12 h-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed border-l border-border-subtle"
            >
                <span className="material-symbols-outlined text-lg select-none">add</span>
            </button>
        </div>
    );
};

export default CustomNumberInput;
