import React, { useState } from 'react';
import useI18n from '@/hooks/useI18n';

export default function BillConference({ activeOrders, formatCurrency }) {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState(false);

    // Aggregate items across all active orders
    const allItems = [];
    activeOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                allItems.push({
                    ...item,
                    orderId: order.id
                });
            });
        }
    });

    if (allItems.length === 0) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-[20px] overflow-hidden mb-4">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400">receipt_long</span>
                    <span className="text-sm font-black text-white">{t('floor.drawer.checkout.bill_conference')}</span>
                    <span className="text-xs text-text-muted font-medium ml-2">({allItems.length} {t('floor.drawer.checkout.items')})</span>
                </div>
                <span className="material-symbols-outlined text-text-muted">
                    {expanded ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {expanded && (
                <div className="p-4 bg-black/20 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {allItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="flex gap-2 text-white/80">
                                <span className="font-bold text-white/50">{item.quantity}x</span>
                                <span>{item.name}</span>
                            </div>
                            <span className="font-medium text-white">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
