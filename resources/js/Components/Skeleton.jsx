import React from 'react';

/**
 * Base Shimmer Skeleton block
 */
export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-white/[0.06] border border-white/[0.04] ${className}`}
            aria-hidden="true"
            {...props}
        />
    );
}

/**
 * Skeleton card for product / pizza catalog
 */
export function ProductCardSkeleton() {
    return (
        <div className="bg-[#18181B] rounded-2xl p-4 border border-white/5 flex flex-col gap-3 shadow-lg">
            <Skeleton className="w-full h-36 rounded-xl" />
            <div className="flex items-center justify-between gap-2 mt-1">
                <Skeleton className="h-5 w-3/5 rounded-md" />
                <Skeleton className="h-4 w-1/4 rounded-md" />
            </div>
            <Skeleton className="h-3 w-4/5 rounded-md" />
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
        </div>
    );
}

/**
 * Skeleton card for table / floor grid
 */
export function TableCardSkeleton() {
    return (
        <div className="bg-[#18181B] rounded-2xl p-5 border border-white/5 flex flex-col justify-between h-44 shadow-lg">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
        </div>
    );
}

export default Skeleton;
