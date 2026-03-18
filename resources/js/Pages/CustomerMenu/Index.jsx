import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import CartDrawer from './components/CartDrawer';
import ProductGrid from './components/ProductGrid';
import { useCart } from './hooks/useCart';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';

function groupProductsByCategory(products, uncategorizedLabel) {
    const grouped = (products ?? []).reduce((accumulator, product) => {
        const categoryName = product.category || uncategorizedLabel;

        if (!accumulator[categoryName]) {
            accumulator[categoryName] = [];
        }

        accumulator[categoryName].push(product);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([name, items], index) => ({
        id: `${name}-${index}`,
        name,
        products: items,
    }));
}

export default function Index() {
    const { t, formatCurrency } = useI18n();
    const { catalogEndpoint } = usePage().props;
    const { data, error, isLoading, refetch } = useDigitalMenuQuery();
    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
    } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);

    const catalogCategories = groupProductsByCategory(
        data?.products ?? [],
        t('digital_menu.catalog.uncategorized')
    );

    const handleAddToCart = (product) => {
        addItem(product, 1);
    };

    return (
        <main className="w-full min-h-screen bg-gray-900 text-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                <header className="mb-8 sm:mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">{t('digital_menu.header.title')}</h1>
                    <p className="text-gray-400 mt-3 text-base sm:text-lg">{t('digital_menu.header.subtitle')}</p>
                </header>

                <section className="rounded-2xl border border-gray-700 bg-gray-800/40 p-4 sm:p-5 lg:p-6">
                    <p className="text-sm text-gray-400">{t('digital_menu.catalog.search_placeholder')}</p>

                    {isLoading ? (
                        <p className="text-sm mt-2 text-gray-300">{t('digital_menu.catalog.loading')}</p>
                    ) : null}

                    {error ? (
                        <div className="mt-3 space-y-2">
                            <p className="text-sm text-red-300">{t('digital_menu.errors.catalog_load_failed')}</p>
                            <button
                                type="button"
                                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
                                onClick={refetch}
                            >
                                {t('digital_menu.actions.retry')}
                            </button>
                        </div>
                    ) : null}

                    {!isLoading && !error ? (
                        <div className="mt-5">
                            <ProductGrid
                                categories={catalogCategories}
                                t={t}
                                formatCurrency={formatCurrency}
                                onAddToCart={handleAddToCart}
                            />
                        </div>
                    ) : null}

                    <p className="text-xs mt-5 text-gray-500">{catalogEndpoint}</p>
                </section>
            </div>

            <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-6 right-6 z-40 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg"
            >
                {t('digital_menu.cart.open_cart')}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {cartItemCount}
                </span>
            </button>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={items}
                cartTotal={cartTotal}
                cartItemCount={cartItemCount}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                clearCart={clearCart}
                t={t}
                formatCurrency={formatCurrency}
            />
        </main>
    );
}
