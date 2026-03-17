import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import ProductGrid from './components/ProductGrid';
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
    const { t } = useI18n();
    const { catalogEndpoint } = usePage().props;
    const { data, error, isLoading, refetch } = useDigitalMenuQuery();

    const catalogCategories = groupProductsByCategory(
        data?.products ?? [],
        t('digital_menu.catalog.uncategorized')
    );

    return (
        <main className="min-h-screen bg-background-dark text-white p-6">
            <header className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold">{t('digital_menu.header.title')}</h1>
                <p className="text-text-muted mt-2">{t('digital_menu.header.subtitle')}</p>
            </header>

            <section className="max-w-4xl mx-auto rounded-xl border border-border-subtle bg-surface p-4">
                <p className="text-sm text-text-muted">{t('digital_menu.catalog.search_placeholder')}</p>

                {isLoading ? (
                    <p className="text-sm mt-2">{t('digital_menu.catalog.loading')}</p>
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
                    <div className="mt-4">
                        <ProductGrid categories={catalogCategories} t={t} />
                    </div>
                ) : null}

                <p className="text-xs mt-4 text-text-muted">{catalogEndpoint}</p>
            </section>

            <div className="max-w-4xl mx-auto mt-6">
                <Link href="/menu/checkout" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold">
                    {t('digital_menu.cart.checkout_action')}
                </Link>
            </div>
        </main>
    );
}
