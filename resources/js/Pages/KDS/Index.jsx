import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KitchenReceiptPrint from '@/Components/KitchenReceiptPrint';

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
                        {item.is_pizza && '🍕 '}{item.name}
                    </span>
                    {item.is_pizza && item.flavor_names?.length > 0 && (
                        <p className={`text-base md:text-lg text-white mt-1 pl-1 font-bold leading-tight uppercase`}>
                            {item.flavor_names.length > 1
                                ? item.flavor_names.map(f => `1/${item.flavor_names.length} ${f}`).join(', ')
                                : item.flavor_names[0]
                            }
                        </p>
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

/* ─── Detail Modal ─── */
function OrderDetailModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#14141A] w-full max-w-lg rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-border-subtle bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined font-bold">receipt_long</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Pedido #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</h3>
                            <p className="text-xs text-text-muted">Detalhes Completos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Local</p>
                            <p className="text-white text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-primary">
                                    {order.table_name ? 'table_bar' : 'countertops'}
                                </span>
                                {order.table_name ? `Mesa ${order.table_name}` : 'Balcão'}
                            </p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Tipo</p>
                            <p className="text-white text-sm font-bold uppercase tracking-tight">{order.type}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">Cliente</p>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                            <p className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                {order.customer_name}
                            </p>
                            {order.customer_phone && (
                                <p className="text-text-muted text-sm flex items-center gap-2 pl-8">
                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                    {order.customer_phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">Itens do Pedido</p>
                        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden divide-y divide-white/5">
                            {order.items.map((item, i) => (
                                <div key={i} className="p-4 flex gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                                        {item.quantity}x
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold leading-tight mb-1 flex items-center gap-2">
                                            {item.is_pizza && <span className="material-symbols-outlined text-primary text-[16px]">local_pizza</span>}
                                            {item.name}
                                        </p>
                                        {item.is_pizza && item.flavor_names?.length > 0 && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                <span className="text-text-muted font-semibold">Sabores: </span>
                                                {item.flavor_names.length > 1
                                                    ? item.flavor_names.map((f, fi) => (
                                                        <span key={fi}>
                                                            <span className="text-primary font-mono text-[10px]">1/{item.flavor_names.length} </span>
                                                            <span className="text-slate-300">{f}</span>
                                                            {fi < item.flavor_names.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))
                                                    : <span className="text-slate-300">{item.flavor_names[0]}</span>
                                                }
                                            </p>
                                        )}
                                        {item.notes && (
                                            <div className="flex items-start gap-2 mt-2 bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/15">
                                                <span className="material-symbols-outlined text-orange-400 text-[16px] mt-0.5 flex-shrink-0">warning</span>
                                                <p className="text-xs text-orange-300 font-medium">{item.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-border-subtle bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="w-full bg-surface-hover hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all border border-white/5"
                    >
                        FECHAR DETALHES
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Order Card ─── */
function OrderCard({ order, columnStatus, onShowDetails, onPrint }) {
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
        pending: { label: 'INICIAR', className: 'bg-gradient-to-r from-primary to-[#7C3AED] hover:from-[#7C3AED] hover:to-primary text-white shadow-lg shadow-primary/20' },
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

    return (
        <div className={`relative bg-[#131316] border border-border-subtle rounded-xl p-4 border-l-4 ${colors.bg} shadow-lg group hover:border-white/20 transition-all ${order.status === 'preparing' ? 'border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.05)]' : ''}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h4 className="text-lg font-bold text-white">#{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</h4>
                    <p className="text-sm text-text-muted">
                        {order.table_name ? `Mesa ${order.table_name}` : order.type === 'delivery' ? 'Delivery' : 'Balcão'}
                        {order.customer_name !== 'Cliente' ? ` - ${order.customer_name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPrint(order)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface/50 hover:bg-surface text-text-muted hover:text-white border border-border-subtle transition-all"
                        title="Imprimir via de produção"
                    >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                    </button>
                    <button
                        onClick={() => onShowDetails(order)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5 transition-all"
                        title="Ver detalhes"
                    >
                        <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide border ${colors.badge} ${order.status === 'preparing' ? 'animate-pulse' : ''}`}>
                        {order.status === 'pending' ? 'Aguardando' : order.status === 'preparing' ? 'Preparando' : 'Pronto'}
                    </span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                    <KdsItemRow key={i} item={item} compact dimmed={isDone} />
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                <div className={`flex items-center gap-1.5 ${colors.text} font-mono text-sm ${order.status === 'preparing' ? 'font-bold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {order.status === 'ready' ? 'check_circle' : colors.icon}
                    </span>
                    <span>{order.status === 'ready' ? `Concluído ${order.created_at}` : timeStr}</span>
                </div>
                <button
                    onClick={handleAction}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${action.className}`}
                >
                    {action.label}
                </button>
            </div>
        </div>
    );
}

/* ─── KDS Column ─── */
function KdsColumn({ title, orders, color, count, glow = false, onShowDetails, onPrint }) {
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
                <h3 className="font-semibold text-slate-200">{cfg.label}</h3>
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

/* ─── Main Page ─── */
export default function Index({ orders = [], counts = {} }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [printOrder, setPrintOrder] = useState(null);

    const handlePrintOrder = (order) => {
        setPrintOrder(order);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    const handleShowDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const kdsTopBar = (
        <header className="flex-shrink-0 px-8 py-6 border-b border-border-subtle bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span>🍳</span> Cozinha (KDS)
                    </h2>
                    <p className="text-text-muted text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Atualização automática a cada 10s
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-border-subtle rounded-xl px-5 py-2 min-w-[100px]">
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-0.5">Pendentes</span>
                        <span className="text-white text-2xl font-bold">{counts.pending ?? 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] rounded-xl px-5 py-2 min-w-[100px]">
                        <span className="text-primary text-xs font-bold uppercase tracking-wider mb-0.5">Preparando</span>
                        <span className="text-white text-2xl font-bold">{counts.preparing ?? 0}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/[0.02] border border-border-subtle rounded-xl px-5 py-2 min-w-[100px]">
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-0.5">Prontos</span>
                        <span className="text-white text-2xl font-bold">{counts.ready ?? 0}</span>
                    </div>
                </div>
            </div>
        </header>
    );

    return (
        <AppLayout topBar={kdsTopBar}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-w-[900px]">
                    <KdsColumn title="Pendentes" orders={pendingOrders} color="pending" count={counts.pending ?? 0} onShowDetails={handleShowDetails} onPrint={handlePrintOrder} />
                    <KdsColumn title="Em Preparo" orders={preparingOrders} color="preparing" count={counts.preparing ?? 0} onShowDetails={handleShowDetails} onPrint={handlePrintOrder} glow />
                    <KdsColumn title="Prontos" orders={readyOrders} color="ready" count={counts.ready ?? 0} onShowDetails={handleShowDetails} onPrint={handlePrintOrder} />
                </div>

                <OrderDetailModal
                    order={selectedOrder}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                />
                
                <KitchenReceiptPrint order={printOrder} />
            </div>
        </AppLayout>
    );
}
