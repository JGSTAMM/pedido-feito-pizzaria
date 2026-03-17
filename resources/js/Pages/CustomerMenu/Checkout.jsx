import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

export default function Checkout() {
    const { t } = useI18n();
    const { checkoutEndpoint } = usePage().props;

    return (
        <main className="min-h-screen bg-background-dark text-white p-6">
            <header className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold">{t('digital_menu.checkout.title')}</h1>
                <p className="text-text-muted mt-2">{t('digital_menu.checkout.subtitle')}</p>
            </header>

            <section className="max-w-4xl mx-auto rounded-xl border border-border-subtle bg-surface p-4 space-y-2">
                <p>{t('digital_menu.checkout.customer_name')}</p>
                <p>{t('digital_menu.checkout.customer_phone')}</p>
                <p>{t('digital_menu.checkout.payer_email')}</p>
                <p>{t('digital_menu.checkout.delivery_address')}</p>
                <p>{t('digital_menu.checkout.payment_method')}</p>
                <p className="text-sm text-text-muted">{checkoutEndpoint}</p>
            </section>

            <div className="max-w-4xl mx-auto mt-6 flex gap-3">
                <Link href="/menu" className="px-4 py-2 rounded-lg border border-border-subtle text-white font-semibold">
                    {t('digital_menu.checkout.back_to_menu')}
                </Link>
                <button type="button" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold">
                    {t('digital_menu.checkout.submit_order')}
                </button>
            </div>
        </main>
    );
}
