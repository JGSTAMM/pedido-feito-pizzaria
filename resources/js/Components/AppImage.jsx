import React, { useState } from 'react';
import { resolveMediaPath } from '@/utils/media';

/**
 * AppImage - Global Image Helper
 * Handles mapping local DB paths vs absolute URLs, 
 * and provides fallback behavior if the image fails to load.
 */
export default function AppImage({ src, alt, className, fallback, ...props }) {
    const [error, setError] = useState(false);

    if (!src || error) {
        if (fallback) return fallback;
        
        return (
            <div className={`flex items-center justify-center bg-white/5 ${className}`} {...props}>
                <span className="material-symbols-outlined text-white/20">image_not_supported</span>
            </div>
        );
    }

    const imageUrl = resolveMediaPath(src);

    return (
        <img
            src={imageUrl}
            alt={alt || "Image"}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
}
