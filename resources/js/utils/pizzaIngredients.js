/**
 * Extract customizable ingredient names for a pizza flavor.
 * Prefers structured `ingredients_json` (filtering available items),
 * falling back to parsing the legacy `ingredients` or `description` text.
 */
export function extractFlavorIngredients(flavor) {
    if (!flavor) return [];

    const rawJson = flavor.ingredients_json;
    let parsedJson = [];

    if (Array.isArray(rawJson)) {
        parsedJson = rawJson;
    } else if (typeof rawJson === 'string' && rawJson.trim()) {
        try {
            const decoded = JSON.parse(rawJson);
            if (Array.isArray(decoded)) {
                parsedJson = decoded;
            }
        } catch {
            parsedJson = [];
        }
    }

    if (
        parsedJson.length === 1
        && typeof parsedJson[0] === 'string'
        && (parsedJson[0].includes(',') || /\s+e\s+/i.test(parsedJson[0]))
    ) {
        parsedJson = parsedJson[0]
            .split(/(?:,|\s+e\s+)+/i)
            .map((name) => ({ name: name.trim(), is_available: true }))
            .filter((item) => item.name);
    }

    if (parsedJson.length > 0) {
        return parsedJson
            .filter((item) => {
                if (typeof item === 'string') return item.trim().length > 0;
                return [true, '1', 1].includes(item?.is_available ?? true);
            })
            .map((item) => (typeof item === 'string' ? item.trim() : String(item?.name || '').trim()))
            .filter(Boolean);
    }

    const rawText = String(flavor.ingredients || flavor.description || '').trim();
    if (!rawText) return [];

    const parsed = rawText
        .split(/(?:,|\s+e\s+|\s+and\s+|\|)+/i)
        .map((s) => s.trim())
        .filter(Boolean);

    const unique = [...new Set(parsed)];
    if (String(flavor.flavor_category || '').toLowerCase() === 'salgada') {
        const hasBaseSauce = unique.some((i) => i.toLowerCase().includes('molho'));
        const hasBaseCheese = unique.some((i) => i.toLowerCase().includes('mussarela'));
        const prefix = [];
        if (!hasBaseSauce) prefix.push('Molho sugo');
        if (!hasBaseCheese) prefix.push('Queijo mussarela');
        return [...prefix, ...unique];
    }

    return unique;
}
