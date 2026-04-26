import OrderCard from './OrderCard';

export default function KdsColumn({ title, orders, color, count, glow = false, onShowDetails, onPrint }) {
    const colorMap = {
        pending: { badge: 'bg-amber-500/20 text-amber-400', label: 'Pendentes' },
        preparing: { badge: 'bg-primary/20 text-primary', label: 'Em Preparo' },
        ready: { badge: 'bg-emerald-500/20 text-emerald-400', label: 'Prontos para Servir' },
    };
    const cfg = colorMap[color] || colorMap.pending;

    return (
        <div className="flex flex-col h-full bg-white/[0.02] rounded-2xl border border-border-subtle overflow-hidden relative">
            {glow && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>}
            <div className="px-4 py-3 border-b border-border-subtle bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-semibold text-slate-200">{title || cfg.label}</h3>
                <span className={`${cfg.badge} text-xs px-2 py-0.5 rounded-full font-bold`}>{count}</span>
            </div>
            <div className={`p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide ${color === 'ready' ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} columnStatus={color} onShowDetails={onShowDetails} onPrint={onPrint} />
                ))}
                {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-text-muted opacity-50">
                        <span className="material-symbols-outlined text-3xl mb-2">
                            {color === 'pending' ? 'hourglass_empty' : color === 'preparing' ? 'skillet' : 'done_all'}
                        </span>
                        <p className="text-sm">Nenhum pedido</p>
                    </div>
                )}
            </div>
        </div>
    );
}
