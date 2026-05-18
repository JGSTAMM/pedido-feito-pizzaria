export const resolveImagePath = (url) => {
    if (!url) return '';
    if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/storage/') ||
        url.startsWith('blob:') ||
        url.startsWith('data:')
    ) {
        return url;
    }
    // Remove leading slash if any
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `/storage/${cleanUrl}`;
};

export const resolveMediaPath = resolveImagePath;
