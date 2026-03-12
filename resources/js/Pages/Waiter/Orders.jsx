import MobileLayout from '@/Layouts/MobileLayout';

const statusConfig = {
    pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: 'schedule' },
    preparing: { label: 'Preparando', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: 'skillet' },
    ready: { label: 'Pronto', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: 'check_circle' },
};

export default function Orders({ orders = [], userName = 'Garçom' }) {
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
                        <p className="text-text-muted text-xs font-medium">{orders.length} pedido{orders.length !== 1 ? 's' : ''} ativo{orders.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

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
                    orders.map(order => {
                        const cfg = statusConfig[order.status] || statusConfig.pending;
                        return (
                            <div key={order.id} className="bg-surface border border-border-subtle rounded-2xl p-4 active:scale-[0.98] transition-transform">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-black text-base">#{order.short_code}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <span className="text-text-muted text-xs font-medium">{order.created_at}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-text-muted text-xs">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">table_restaurant</span>
                                            {order.table_name}
                                        </span>
                                        <span>{order.items_count} {order.items_count === 1 ? 'item' : 'itens'}</span>
                                        <span>{order.elapsed_minutes}min</span>
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm">
                                        R$ {order.total.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </MobileLayout>
    );
}
