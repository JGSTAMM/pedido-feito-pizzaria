import React from 'react';
import { TYPE_CONFIG } from '../../utils/orderStatusHelpers';

export default function TabOrder({ orderDetail, formatCurrency, t }) {
    const typeInfo = TYPE_CONFIG[orderDetail.type] ?? { label: orderDetail.type, icon: '📦' };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {/* Informações Principais */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.delivery_data_title')}</h3>

                <div className="space-y-4 px-1">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-white/40 text-[20px]">person</span>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.customer_label')}</p>
                            <p className="text-sm font-bold text-white leading-none">{orderDetail.customer_name}</p>
                            <p className="text-xs text-white/60 mt-1">{orderDetail.customer_phone}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-white/40 text-[20px]">{orderDetail.type === 'delivery' ? 'local_shipping' : 'storefront'}</span>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.mode_label')} ({typeInfo.label})</p>
                            <p className="text-sm font-bold text-white leading-snug">
                                {orderDetail.type === 'delivery'
                                    ? orderDetail.delivery_address
                                    : 'Retirar no local da filial'}
                            </p>
                            {orderDetail.type === 'delivery' && orderDetail.delivery_complement && (
                                <p className="text-xs text-white/60 mt-0.5">{orderDetail.delivery_complement}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Itens do Pedido */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.items_title', { count: orderDetail.items_count })}</h3>

                <div className="space-y-4">
                    {orderDetail.items.map(item => (
                        <div key={item.id} className="flex gap-3 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <span className="text-[11px] font-black bg-white/10 rounded px-2 py-1 text-white shrink-0">
                                {item.quantity}x
                            </span>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-white leading-snug break-words">
                                    {item.name}
                                </p>
                                {item.description && (
                                    <div className="mt-1 space-y-0.5">
                                        {item.description.split('|').map((c, idx) => (
                                            <p key={idx} className="text-xs text-amber-400/80">
                                                ✕ {c.trim()}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <p className="text-xs text-amber-400/80 mt-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                                        {t('digital_menu.payment.observation_label')}: {item.notes}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-white/80 shrink-0 tabular-nums">
                                {formatCurrency(item.subtotal)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {orderDetail.notes && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-3">
                    <span className="material-symbols-outlined text-white/40">speaker_notes</span>
                    <p className="text-sm text-white/80">{orderDetail.notes}</p>
                </div>
            )}
        </div>
    );
}
