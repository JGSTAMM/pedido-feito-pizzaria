import React from 'react';
import useI18n from '@/hooks/useI18n';

export default function ServiceFeeToggle({ serviceFeeEnabled, setServiceFeeEnabled, serviceFeeAmount, formatCurrency }) {
    const { t } = useI18n();

    return (
        <div className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center justify-between mb-4 transition-all">
            <div className="flex flex-col">
                <span className="text-sm font-black text-white">{t('floor.drawer.checkout.service_fee')} (10%)</span>
                <span className="text-xs text-text-muted mt-0.5">
                    {serviceFeeEnabled ? formatCurrency(serviceFeeAmount) : t('floor.drawer.checkout.removed')}
                </span>
            </div>
            
            <button
                onClick={() => setServiceFeeEnabled(!serviceFeeEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    serviceFeeEnabled ? 'bg-emerald-500' : 'bg-white/20'
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        serviceFeeEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}
