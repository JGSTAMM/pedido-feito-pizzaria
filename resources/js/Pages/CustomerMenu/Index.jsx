import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

export default function Index() {
    const { t } = useI18n();
    const { catalogEndpoint } = usePage().props;

    return (
        <main className="min-h-screen bg-background-dark text-white p-6">
            <header className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold">{t('digital_menu.header.title')}</h1>
                <p className="text-text-muted mt-2">{t('digital_menu.header.subtitle')}</p>
            </header>

            <section className="max-w-4xl mx-auto rounded-xl border border-border-subtle bg-surface p-4">
                <p className="text-sm text-text-muted">{t('digital_menu.catalog.search_placeholder')}</p>
                <p className="text-sm mt-2">{catalogEndpoint}</p>
            </section>

            <div className="max-w-4xl mx-auto mt-6">
                <Link href="/menu/checkout" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold">
                    {t('digital_menu.cart.checkout_action')}
                </Link>
            </div>
        </main>
    );
}
