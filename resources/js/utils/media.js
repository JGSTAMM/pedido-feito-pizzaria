export const resolveMediaPath = (path) => {
    if (!path) return '';
    return path.startsWith('http') || path.startsWith('data:') ? path : `/storage/${path}`;
};
