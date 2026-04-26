import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const statusColors = {
    pending: { bg: 'border-l-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', text: 'text-amber-400', icon: 'schedule' },
    preparing: { bg: 'border-l-primary', badge: 'bg-primary/10 text-primary border-primary/20', text: 'text-primary', icon: 'timelapse' },
    ready: { bg: 'border-l-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400', icon: 'check_circle' },
};

function KdsItemRow({ item, compact = false, dimmed = false }) {
    const textColor = dimmed ? 'text-text-muted' : 'text-slate-300';
    const nameColor = dimmed ? 'text-slate-400 line-through decoration-slate-600' : 'text-white';

    return (
        <div className="mb-2">
            <div className={`flex items-start gap-3 md:gap-4 text-sm md:text-base ${textColor}`}>
                <span className={`font-black ${dimmed ? 'text-slate-400 bg-white/5' : 'text-white bg-white/10'} px-2.5 py-1 rounded text-lg md:text-xl flex-shrink-0 shadow`}>
                    {item.quantity}x
                </span>
                <div className="flex-1 min-w-0 mt-0.5">
                    <span className={`font-black text-lg md:text-xl tracking-wide uppercase ${nameColor}`}>
                        {item.name}
                    </span>
                    {item.customization && (
                        <div className="mt-1.5 space-y-1">
                            {item.customization.split('|').map((c, idx) => (
                                <p key={idx} className="text-amber-400 font-black text-sm md:text-base uppercase tracking-wide flex items-center gap-1.5">
                                    <span className="text-red-400">✕</span> {c.trim()}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {item.notes && (
                <div className={`flex items-start gap-2 mt-3 ${compact ? 'ml-[42px]' : 'ml-[52px]'} bg-red-700 p-3 rounded-lg border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)]`}>
                    <span className="material-symbols-outlined text-white text-[24px] flex-shrink-0 animate-pulse font-black">warning</span>
                    <span className="text-white font-black text-sm md:text-lg uppercase tracking-widest leading-snug drop-shadow-md">{item.notes}</span>
                </div>
            )}
        </div>
    );
}

export default function OrderCard({ order, columnStatus, onShowDetails, onPrint }) {
    const colors = statusColors[order.status] || statusColors.pending;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = () => {
        const nextStatus = {
            pending: 'preparing',
            preparing: 'ready',
            ready: 'delivered',
        }[order.status];

        if (nextStatus) {
            router.post(`/kds/${order.id}/status/${nextStatus}`, {}, { preserveScroll: true });
        }
    };

    const actionConfig = {
        pending: { label: 'INICIAR', className: 'bg-gradient-to-r from-primary to-[#0891b2] hover:from-[#0891b2] hover:to-primary text-white shadow-lg shadow-primary/20' },
        preparing: { label: 'PRONTO', className: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30' },
        ready: { label: 'ENTREGUE', className: 'text-text-muted hover:text-white' },
    };

    const action = actionConfig[order.status];

    // Calculate real-time elapsed
    const createdAt = new Date(order.created_at_iso || order.created_at);
    const diffMs = Math.max(0, currentTime - createdAt);
    const totalSeconds = Math.floor(diffMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    const timeStr = `${mm}:${ss}`;

    const isDone = order.status === 'ready';

    // Filter kitchen items (non-beverages) for the main card
    const kitchenItems = order.items.filter(i => !i.is_beverage);

    return (
        <div className={`relative bg-[#131316] border border-border-subtle rounded-xl p-4 border-l-4 ${colors.bg} shadow-lg group hover:border-white/20 transition-all ${order.status === 'preparing' ? 'border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.05)]' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-lg font-black text-white italic tracking-tighter leading-none">#{order.short_code}</h4>
                        {order.is_paid ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded font-black border border-emerald-500/20">PAGO</span>
                        ) : (
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded font-black border border-amber-500/20">PIX/DINH</span>
                        )}
                    </div>
                    <p className="text-[11px] text-text-muted font-bold truncate">
                        {order.table_name ? `MESA ${order.table_name}` : order.type === 'delivery' ? 'DELIVERY' : 'BALCÃO'}
                        {order.customer_name !== 'Cliente' ? ` - ${order.customer_name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => onPrint(order)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/50 hover:bg-surface text-text-muted hover:text-white border border-border-subtle transition-all"
                    >
                        <span className="material-symbols-outlined text-[16px]">print</span>
                    </button>
                    <button
                        onClick={() => onShowDetails(order)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {kitchenItems.map((item, i) => (
                    <KdsItemRow key={i} item={item} compact dimmed={isDone} />
                ))}
                {kitchenItems.length === 0 && (
                    <p className="text-xs text-blue-400 italic">Pedido contém apenas bebidas (veja nos detalhes)</p>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                <div className={`flex items-center gap-1.5 ${colors.text} font-mono text-sm ${order.status === 'preparing' ? 'font-bold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {order.status === 'ready' ? 'check_circle' : colors.icon}
                    </span>
                    <span>{order.status === 'ready' ? `FIM ${order.created_at}` : timeStr}</span>
                </div>
                <button
                    onClick={handleAction}
                    className={`text-[10px] font-black tracking-widest px-4 py-2 rounded-lg transition-all uppercase ${action.className}`}
                >
                    {action.label}
                </button>
            </div>
        </div>
    );
}
