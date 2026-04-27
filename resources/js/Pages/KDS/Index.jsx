import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import KitchenReceiptPrint from '@/Components/KitchenReceiptPrint';
import KdsColumn from './Components/KdsColumn';

/* ─── Detail Modal ─── */
function OrderDetailModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    const beverages = order.items.filter(i => i.is_beverage);
    const kitchenItems = order.items.filter(i => !i.is_beverage);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background-dark/90 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-[#14141A] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-3xl font-bold">receipt_long</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white italic tracking-tight">Pedido #{order.short_code}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${order.is_paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                    {order.is_paid ? 'PAGO' : 'PAGAMENTO PENDENTE'}
                                </span>
                                <span className="text-xs text-text-muted font-bold">• {order.created_at_iso ? new Date(order.created_at_iso).toLocaleString('pt-BR') : order.created_at}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
                    {/* Status & Payment Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Canal / Tipo</p>
                            <p className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">
                                    {order.type === 'delivery' ? 'delivery_dining' : order.type === 'salon' ? 'table_bar' : 'store'}
                                </span>
                                {order.type === 'delivery' ? 'Delivery' : order.type === 'salon' ? 'Mesa / Salão' : 'Retirada'}
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Pagamento</p>
                            <p className="text-white font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400">payments</span>
                                {order.payment_method_online ? (
                                    <span className="truncate">{order.payment_method_online.toUpperCase()} (Online)</span>
                                ) : 'Local / Manual'}
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2">Valor Total</p>
                            <p className="text-primary text-lg font-black">{formatCurrency(order.total_amount)}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary"></span> Dados do Cliente
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg text-primary">person</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{order.customer_name}</p>
                                        <p className="text-xs text-text-muted">Nome completo</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg text-primary">call</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{order.customer_phone}</p>
                                        <p className="text-xs text-text-muted italic">WhatsApp</p>
                                    </div>
                                </div>
                                {order.payer_email && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-lg text-primary">mail</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white truncate max-w-[200px]">{order.payer_email}</p>
                                            <p className="text-xs text-text-muted">E-mail</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary"></span> Local de Entrega / Mesa
                            </h4>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 min-h-[100px] flex flex-col justify-center">
                                {order.type === 'delivery' ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-white leading-tight">
                                            {order.delivery_address}
                                        </p>
                                        {order.delivery_complement && (
                                            <p className="text-xs text-text-muted">Comp: {order.delivery_complement}</p>
                                        )}
                                        {order.neighborhood_name && (
                                            <p className="text-xs font-black text-primary uppercase tracking-wider">{order.neighborhood_name}</p>
                                        )}
                                    </div>
                                ) : order.type === 'salon' ? (
                                    <div className="flex flex-col items-center justify-center py-2">
                                        <p className="text-4xl font-black text-white italic">MESA {order.table_name}</p>
                                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Consumo no Local</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-2">
                                        <p className="text-2xl font-black text-white italic uppercase tracking-tighter">RETIRADA NO BALCÃO</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                        <div>
                            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-500"></span> Observações Gerais
                            </h4>
                            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-sm font-bold text-red-200">{order.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Items Section */}
                    <div>
                        <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary"></span> Itens da Cozinha
                        </h4>
                        <div className="space-y-3">
                            {kitchenItems.map((item, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-lg shrink-0">
                                        {item.quantity}x
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">{item.name}</p>
                                        {item.customization && (
                                            <div className="mt-1.5 space-y-1">
                                                {item.customization.split('|').map((c, idx) => (
                                                    <p key={idx} className="text-amber-400 font-black text-xs md:text-sm uppercase tracking-wide flex items-center gap-1.5">
                                                        <span className="text-red-400">✕</span> {c.trim()}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <div className="mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                                <p className="text-xs font-black text-red-300 uppercase tracking-widest">OBS: {item.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Beverages Section */}
                    {beverages.length > 0 && (
                        <div>
                            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span> Bebidas
                            </h4>
                            <div className="space-y-2">
                                {beverages.map((item, i) => (
                                    <div key={i} className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-blue-400 font-black">{item.quantity}x</span>
                                            <span className="text-white font-bold text-sm uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-blue-400/50">local_bar</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-dark text-[#0D0D12] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(90,90,246,0.3)] uppercase tracking-widest"
                    >
                        FECHAR DETALHES
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ─── */
export default function Index({ orders = [], counts = {} }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [printOrder, setPrintOrder] = useState(null);
    const printTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
        };
    }, []);

    const handlePrintOrder = (order) => {
        setPrintOrder(order);
        if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
        printTimeoutRef.current = setTimeout(() => {
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
