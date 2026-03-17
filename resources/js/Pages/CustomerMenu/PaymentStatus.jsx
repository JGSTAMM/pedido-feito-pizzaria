import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

export default function PaymentStatus() {
    const { t } = useI18n();
    const { orderId, statusEndpoint } = usePage().props;

    return (
        <main className="min-h-screen bg-background-dark text-white p-6">
            <header className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold">{t('digital_menu.payment.status_title')}</h1>
                <p className="text-text-muted mt-2">{t('digital_menu.payment.status_subtitle')}</p>
            </header>

            <section className="max-w-4xl mx-auto rounded-xl border border-border-subtle bg-surface p-4 space-y-2">
                <p>{t('digital_menu.payment.order_id', { id: orderId })}</p>
                <p>{t('digital_menu.status.awaiting_payment')}</p>
                <p className="text-sm text-text-muted">{statusEndpoint}</p>
            </section>

            <div className="max-w-4xl mx-auto mt-6">
                <Link href="/menu" className="px-4 py-2 rounded-lg bg-primary text-white font-semibold">
                    {t('digital_menu.payment.back_to_menu')}
                </Link>
            </div>
        </main>
    );
}
