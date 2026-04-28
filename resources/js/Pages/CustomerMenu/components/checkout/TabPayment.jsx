import React from 'react';
import { Link } from '@inertiajs/react';

export default function TabPayment({ statusKey, paymentData, orderDetail, formatCurrency, t }) {
    const isCashPayment = !paymentData?.paymentMethodOnline && !orderDetail.payment_method_online;
    const isApproved = ['paid_online', 'accepted', 'preparing', 'ready', 'delivered', 'completed', 'paid', 'pending'].includes(statusKey);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">

            {/* Status e Método */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.payment_title')}</h3>

                <div className="space-y-5 px-1">
                    <div className="flex gap-3 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            <span className="material-symbols-outlined">{isApproved ? 'check_circle' : 'hourglass_empty'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.payment_status_label')}</p>
                            <p className={`text-sm font-bold leading-none ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isApproved ? t('digital_menu.payment.payment_status_approved') : t('digital_menu.payment.payment_status_pending')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white/60 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">{isCashPayment ? 'payments' : 'credit_card'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.payment_method_label')}</p>
                            <p className="text-sm font-bold text-white leading-tight break-words whitespace-normal">
                                {isCashPayment ? t('digital_menu.payment.payment_method_direct') : t('digital_menu.payment.payment_method_online')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejeição */}
            {statusKey === 'rejected' && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
                    <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl">error</span>
                    </div>
                    <p className="text-base font-bold text-red-400 mb-1">{t('digital_menu.payment.payment_rejected_title')}</p>
                    <p className="text-sm text-white/60 mb-4">{t('digital_menu.payment.payment_rejected_desc')}</p>
                    <Link href="/menu/checkout" className="block w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide transition-colors">
                        {t('digital_menu.payment.retry_payment')}
                    </Link>
                </div>
            )}

            {/* Info de Dinheiro */}
            {isCashPayment && statusKey !== 'delivered' && statusKey !== 'completed' && statusKey !== 'cancelled' && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
                    <p className="text-base font-bold text-amber-400 mb-1">💵 {t('digital_menu.payment.cash_on_delivery_title', { type: orderDetail.type === 'delivery' ? t('digital_menu.payment.delivery_type') : t('digital_menu.payment.pickup_type') })}</p>
                    <p className="text-sm text-white/60">{t('digital_menu.payment.cash_on_delivery_desc')}</p>
                </div>
            )}

            {/* Resumo de Valores */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.financial_summary_title')}</h3>

                <div className="space-y-2.5 px-1 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">{t('digital_menu.payment.subtotal_label')}</span>
                        <span className="text-white">{formatCurrency(orderDetail.total_amount - orderDetail.delivery_fee)}</span>
                    </div>
                    {orderDetail.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">{t('digital_menu.payment.delivery_fee_label')}</span>
                            <span className="text-white">{formatCurrency(orderDetail.delivery_fee)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 pt-4 px-1 flex justify-between items-center">
                    <span className="font-bold text-white">{t('digital_menu.payment.grand_total_label')}</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(orderDetail.total_amount)}</span>
                </div>
            </div>

        </div>
    );
}
