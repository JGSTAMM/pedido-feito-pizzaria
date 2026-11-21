import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';
import PinDeleteConfirmModal from '@/Components/PinDeleteConfirmModal';
import ReceiveOrderPaymentModal from '@/Components/ReceiveOrderPaymentModal';

const statusConfig = {
    pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: 'schedule' },
    preparing: { label: 'Preparando', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: 'skillet' },
    ready: { label: 'Pronto', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: 'check_circle' },
    delivered: { label: 'Entregue', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: 'done_all' },
};

export default function Orders({ orders = [], userName = 'Garçom' }) {
    const { flash } = usePage().props;
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [orderToPay, setOrderToPay] = useState(null);

    const formatBRL = (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

    return (
        <MobileLayout activeTab="/waiter/orders">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background-dark/90 backdrop-blur-xl border-b border-border-subtle px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-black tracking-tight">Comandas</h1>
                        <p className="text-text-muted text-xs font-medium">
                            {orders.length} pedido{orders.length !== 1 ? 's' : ''} ativo{orders.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {flash?.success && (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{flash.success}</span>
                </div>
            )}

            {/* Orders List */}
            <div className="px-4 py-4 space-y-3 pb-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-16 bg-surface border border-border-subtle rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[32px] text-text-muted">receipt_long</span>
                        </div>
                        <p className="text-white font-bold text-lg mb-1">Nenhuma comanda ativa</p>
                        <p className="text-text-muted text-sm">Os pedidos em andamento aparecerão aqui</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const cfg = statusConfig[order.status] || statusConfig.pending;
                        const isCounter = !order.table_id;
                        const showReceiveBtn = isCounter && !order.is_paid;

                        return (
                            <div key={order.id} className="bg-surface border border-border-subtle rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white font-black text-base">#{order.short_code}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        {isCounter && (
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                                                    order.is_paid
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                                        : 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                                }`}
                                            >
                                                {order.is_paid ? 'Pago' : 'Pagar no Caixa'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-text-muted text-xs font-medium shrink-0">{order.created_at}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-text-muted text-xs">
                                        <span className="flex items-center gap-1 text-white/80 font-semibold">
                                            <span className="material-symbols-outlined text-[14px] text-primary">
                                                {isCounter ? 'storefront' : 'table_restaurant'}
                                            </span>
                                            {isCounter ? `Balcão • ${order.customer_name || 'Cliente'}` : order.table_name}
                                        </span>
                                        <span>{order.items_count} {order.items_count === 1 ? 'item' : 'itens'}</span>
                                        <span>{order.elapsed_minutes}min</span>
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm shrink-0">
                                        {formatBRL(order.total)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    {showReceiveBtn && (
                                        <button
                                            type="button"
                                            onClick={() => setOrderToPay(order)}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">payments</span>
                                            Receber
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setOrderToDelete(order)}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                        Apagar (PIN)
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <PinDeleteConfirmModal
                isOpen={Boolean(orderToDelete)}
                onClose={() => setOrderToDelete(null)}
                title={orderToDelete ? `Apagar Pedido #${orderToDelete.short_code}` : 'Apagar Pedido'}
                description="Cancela o pedido na cozinha, estorna do caixa e remove da mesa/comanda. Código PIN obrigatório."
                targetLabel={orderToDelete ? `#${orderToDelete.short_code} • ${orderToDelete.table_name} — ${formatBRL(orderToDelete.total)}` : ''}
                endpoint={orderToDelete ? `/orders/${orderToDelete.id}/delete-with-pin` : null}
                onSuccess={() => setOrderToDelete(null)}
            />

            <ReceiveOrderPaymentModal
                isOpen={Boolean(orderToPay)}
                onClose={() => setOrderToPay(null)}
                order={orderToPay}
                onSuccess={() => setOrderToPay(null)}
            />
        </MobileLayout>
    );
}
