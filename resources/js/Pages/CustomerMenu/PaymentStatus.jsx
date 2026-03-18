import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import { usePaymentStatusPolling } from './hooks/usePaymentStatusPolling';

function resolveStatusKey(currentStatus) {
    const normalizedStatus = String(currentStatus || '').toLowerCase();

    if (normalizedStatus === 'paid' || normalizedStatus === 'paid_online') {
        return 'paid_online';
    }

    if (normalizedStatus === 'accepted') {
        return 'accepted';
    }

    if (normalizedStatus === 'rejected') {
        return 'rejected';
    }

    return 'awaiting_payment';
}

export default function PaymentStatus() {
    const { t } = useI18n();
    const { orderId, statusEndpoint } = usePage().props;
    const { status, paymentData, isLoading, error } = usePaymentStatusPolling(orderId);
    const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);

    const statusKey = useMemo(() => resolveStatusKey(status), [status]);
    const pixQrCode = paymentData?.pixQrCode ?? null;
    const pixQrCodeBase64 = paymentData?.pixQrCodeBase64 ?? null;

    const handleCopyPixCode = async () => {
        if (!pixQrCode) {
            return;
        }

        try {
            await navigator.clipboard.writeText(pixQrCode);
            setCopyFeedbackVisible(true);
            window.setTimeout(() => {
                setCopyFeedbackVisible(false);
            }, 2000);
        } catch {
            setCopyFeedbackVisible(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center py-12 px-4">
            <section className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-3xl shadow-2xl p-8 text-center space-y-4">
                <h1 className="text-2xl font-bold text-white">{t('digital_menu.payment.status_title')}</h1>
                <p className="text-sm text-gray-400">{t('digital_menu.payment.status_subtitle')}</p>

                <p className="text-sm text-gray-300">{t('digital_menu.payment.order_id', { id: orderId })}</p>

                {isLoading ? (
                    <p className="text-sm text-gray-400">{t('digital_menu.payment.polling_loading')}</p>
                ) : null}

                {error ? (
                    <p className="text-sm text-red-300">{t('digital_menu.payment.polling_error')}</p>
                ) : null}

                <p className="text-lg font-semibold text-white">{t(`digital_menu.status.${statusKey}`)}</p>

                {statusKey === 'awaiting_payment' && pixQrCodeBase64 ? (
                    <div className="space-y-3 rounded-2xl border border-gray-700 bg-gray-900/60 p-4">
                        <h2 className="text-base font-semibold text-white">{t('digital_menu.payment.pix_qr_title')}</h2>
                        <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
                            <img
                                src={`data:image/png;base64,${pixQrCodeBase64}`}
                                alt={t('digital_menu.payment.pix_qr_title')}
                                className="w-44 h-44"
                            />
                        </div>
                    </div>
                ) : null}

                {statusKey === 'awaiting_payment' && pixQrCode ? (
                    <div className="space-y-3 rounded-2xl border border-gray-700 bg-gray-900/60 p-4">
                        <p className="text-sm text-gray-400">{t('digital_menu.payment.pix_copy_label')}</p>
                        <p className="break-all text-xs text-gray-200">{pixQrCode}</p>
                        <button
                            type="button"
                            onClick={handleCopyPixCode}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                        >
                            {t('digital_menu.payment.copy_code')}
                        </button>
                        {copyFeedbackVisible ? (
                            <p className="text-xs text-emerald-300">{t('digital_menu.payment.copy_success')}</p>
                        ) : null}
                    </div>
                ) : null}

                <p className="text-xs text-gray-500">{statusEndpoint}</p>
                <div className="pt-2">
                    <Link href="/menu" className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900">
                        {t('digital_menu.payment.back_to_menu')}
                    </Link>
                </div>
            </section>
        </main>
    );
}
