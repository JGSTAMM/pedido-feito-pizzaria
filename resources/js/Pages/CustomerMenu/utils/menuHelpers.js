/**
 * Pure utility functions for the digital menu.
 * None of these use React hooks — they are deterministic transformers.
 */

export function translateCategoryName(name, t) {
    if (!name) return '';
    const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    const translated = t(`digital_menu.catalog.categories.${normalized}`);
    return translated === `digital_menu.catalog.categories.${normalized}` ? name : translated;
}

export function injectBaseIngredients(ingredients, flavorCategory, name) {
    const cat = (flavorCategory || '').toLowerCase();
    const isSavory = !cat || ['salgada', 'tradicional', 'especial'].includes(cat);
    const isForceSweet = (name || '').toLowerCase().includes('doce') || (name || '').toLowerCase().includes('chocolate');

    if (isSavory && !isForceSweet) {
        const base = "Molho artesanal, Queijo mussarela ralado";
        if (!ingredients) return base;
        if (ingredients.toLowerCase().includes('molho artesanal')) return ingredients;
        return `${base}, ${ingredients}`;
    }
    return ingredients;
}

export function groupProductsByCategory(products, uncategorizedLabel, t, translateDynamic) {
    const grouped = (products ?? []).reduce((accumulator, product) => {
        const categoryName = product.category || uncategorizedLabel;
        if (!accumulator[categoryName]) accumulator[categoryName] = [];

        const translatedProduct = {
            ...product,
            name: translateDynamic(product.name),
            description: translateDynamic(product.description),
            ingredients: translateDynamic(product.ingredients),
            price: parseFloat(product.price || 0)
        };

        accumulator[categoryName].push(translatedProduct);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([name, items], index) => ({
        id: name + '-' + index,
        name: translateCategoryName(name, t),
        products: items,
    }));
}

const PIZZA_FLAVOR_DISPLAY_ORDER = ['tradicional', 'especial', 'doce', 'salgada'];

export function groupPizzaFlavorsByCategory(flavors, t, translateDynamic) {
    const grouped = (flavors ?? []).reduce((acc, flavor) => {
        let cat = (flavor.flavor_category || '').toLowerCase();
        const price = parseFloat(flavor.base_price || 0);

        if (!cat || cat === 'salgada') {
            if (price >= 70 && price <= 85) cat = 'tradicional';
            else if (price >= 90 && price <= 105) cat = 'especial';
            else if (flavor.name.toLowerCase().includes('doce') || flavor.name.toLowerCase().includes('chocolate')) cat = 'doce';
            else cat = 'tradicional';
        }

        if (!acc[cat]) acc[cat] = [];

        acc[cat].push({
            ...flavor,
            name: translateDynamic(flavor.name),
            description: translateDynamic(injectBaseIngredients(flavor.description || flavor.ingredients, flavor.flavor_category, flavor.name)),
            ingredients: translateDynamic(injectBaseIngredients(flavor.ingredients, flavor.flavor_category, flavor.name)),
            price,
            type: 'pizza_flavor'
        });
        return acc;
    }, {});

    return Object.entries(grouped)
        .sort(([a], [b]) => {
            const idxA = PIZZA_FLAVOR_DISPLAY_ORDER.indexOf(a);
            const idxB = PIZZA_FLAVOR_DISPLAY_ORDER.indexOf(b);
            return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
        })
        .map(([cat, items]) => {
            const key = `digital_menu.pizza_categories.${cat}`;
            let name = t(key);
            if (name === key) name = cat.charAt(0).toUpperCase() + cat.slice(1);

            return {
                id: `pizza-${cat}`,
                name,
                products: items,
                isPizzaFlavorGroup: true
            };
        });
}

export function buildCatalogCategories(data, t, translateDynamic) {
    if (!data) return [];

    const baseCategories = groupProductsByCategory(
        data.products,
        t('digital_menu.catalog.uncategorized'),
        t,
        translateDynamic
    );

    const pizzaCategories = groupPizzaFlavorsByCategory(
        data.pizza_flavors,
        t,
        translateDynamic
    );

    return [...pizzaCategories, ...baseCategories];
}

export function buildFeaturedProducts(products, translateDynamic) {
    return [...(products ?? [])]
        .filter(p => !p.category?.toLowerCase().includes('extra'))
        .slice(0, 4)
        .map(p => ({
            ...p,
            name: translateDynamic(p.name),
            description: translateDynamic(p.description),
            price: parseFloat(p.price || 0)
        }));
}
