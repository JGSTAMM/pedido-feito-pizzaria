import React from 'react';
import OrderStepper from './OrderStepper';
import PixSection from './PixSection';

export default function TabStatus({ activeStep, statusKey, pixQrCode, pixQrCodeBase64, t }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-4">
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/60">local_shipping</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/80">{t('digital_menu.payment.tracking_title')}</h2>
                        <p className="text-xs text-white/40">{t('digital_menu.payment.tracking_subtitle')}</p>
                    </div>
                </div>

                {statusKey !== 'cancelled' && statusKey !== 'rejected' ? (
                    <OrderStepper activeStep={activeStep} t={t} />
                ) : (
                    <div className="py-8 text-center text-white/40 font-bold uppercase tracking-widest text-sm">
                        {t('digital_menu.payment.tracking_unavailable')}
                    </div>
                )}

                {statusKey === 'awaiting_payment' && (pixQrCode || pixQrCodeBase64) && (
                    <PixSection pixQrCode={pixQrCode} pixQrCodeBase64={pixQrCodeBase64} />
                )}
            </div>

            <p className="text-center text-xs text-white/40 mt-6 px-4">
                {t('digital_menu.payment.auto_update_notice')}
            </p>
        </div>
    );
}
