/**
 * Normalize a string for accent-insensitive comparison.
 * Decomposes accented characters and strips diacritics.
 * Example: "Brócolis" → "brocolis"
 */
export function norm(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
