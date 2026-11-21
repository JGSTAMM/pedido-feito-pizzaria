import useI18n from '@/hooks/useI18n';

export default function StoreClosedBanner({ storeAvailability, className = '' }) {
    const { t } = useI18n();

    if (!storeAvailability || storeAvailability.is_accepting_orders) {
        return null;
    }

    const fallbackByReason = storeAvailability.reason
        ? t(`digital_menu.availability.${storeAvailability.reason}`)
        : '';

    const detail = storeAvailability.message || fallbackByReason;

    return (
        <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl border border-red-500/35 bg-red-950/35 px-4 py-3.5 text-left shadow-lg ${className}`}
        >
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-lg text-red-400" aria-hidden="true">
                    storefront
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider text-red-300">
                        {t('digital_menu.availability.closed_banner_title')}
                    </p>
                    {detail ? (
                        <p className="text-xs font-medium leading-relaxed text-red-100/90">
                            {detail}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
