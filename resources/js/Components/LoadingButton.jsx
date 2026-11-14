import React from 'react';

/**
 * Reusable LoadingButton component with anti-flood protection.
 * Automatically blocks repeat clicks when loading or disabled.
 */
export default function LoadingButton({
    children,
    isLoading = false,
    loadingText,
    disabled = false,
    variant = 'primary',
    size = 'md',
    icon = null,
    className = '',
    type = 'button',
    onClick,
    ...props
}) {
    const isDisabled = disabled || isLoading;

    const baseStyles = 'relative inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] select-none';

    const sizeStyles = {
        sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5 min-h-[36px]',
        md: 'h-11 px-5 text-sm sm:text-base rounded-xl gap-2 min-h-[44px]',
        lg: 'h-13 sm:h-14 px-6 py-3.5 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl gap-2.5 min-h-[52px]',
    };

    const variantStyles = {
        primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 disabled:shadow-none',
        emerald: 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 disabled:shadow-none',
        secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20',
        danger: 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/25 disabled:shadow-none',
    };

    const stateStyles = isDisabled
        ? 'opacity-60 cursor-not-allowed pointer-events-none'
        : 'cursor-pointer';

    return (
        <button
            type={type}
            disabled={isDisabled}
            aria-busy={isLoading}
            onClick={isDisabled ? undefined : onClick}
            className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${stateStyles} ${className}`}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg
                        className="animate-spin h-5 w-5 text-current shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {typeof icon === 'string' ? (
                        <span className="material-symbols-outlined text-[20px] sm:text-[22px] shrink-0" aria-hidden="true">
                            {icon}
                        </span>
                    ) : (
                        icon
                    )}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
}
