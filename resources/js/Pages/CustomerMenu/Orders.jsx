import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';
import BottomNav from './components/navigation/BottomNav';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

const TYPE_CONFIG = {
    pickup: { label: 'Retirada no Balcão', icon: '🏪' },
    delivery: { label: 'Delivery', icon: '🛵' },
    salon: { label: 'Mesa (Salão)', icon: '🍽️' },
    dine_in: { label: 'Mesa (Salão)', icon: '🍽️' },
};

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    preparing: { label: 'Preparando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    ready: { label: 'Pronto para Retirada', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    delivered: { label: 'Entregue', color: 'bg-white/10 text-white/60 border-white/20' },
    paid: { label: 'Pago', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    paid_online: { label: 'Pago Online', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    accepted: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    rejected: { label: 'Recusado', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
    awaiting_payment: { label: 'Aguardando Pagamento', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    completed: { label: 'Concluído', color: 'bg-white/10 text-white/60 border-white/20' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-white/5 text-white/40' };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

function PaymentBadge({ order }) {
    const isCash = !order.payment_method_online;
    if (isCash) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400/80">
                💵 Pagamento na {order.type === 'delivery' ? 'entrega' : 'retirada'}
            </span>
        );
    }
    const paid = order.online_payment_status === 'approved';
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${paid ? 'text-emerald-400' : 'text-amber-400'}`}>
            {paid ? '✅ Pago Online' : '⏳ Pagamento Pendente'}
        </span>
    );
}

function OrderCard({ order, t, formatCurrency }) {
    const typeInfo = TYPE_CONFIG[order.type] ?? { label: order.type, icon: '📦' };

    return (
        <Link
            href={`/menu/order/${order.id}/status`}
            className={`${luccheseMenuTheme.glass} block rounded-3xl p-5 hover:border-primary/40 hover:scale-[1.01] transition-all`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Pedido <span className="text-white text-sm">#{order.short_code}</span>
                    </p>
                    <p className="text-xs font-semibold text-white/40 mt-0.5">{order.created_at_formatted}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {/* Customer & Type */}
            <div className="flex items-center gap-3 mb-3 text-sm">
                <span className="text-base">{typeInfo.icon}</span>
                <div className="min-w-0">
                    <p className="font-bold text-white truncate">{order.customer_name}</p>
                    <p className="text-[11px] text-white/40">{typeInfo.label}</p>
                </div>
            </div>

            {/* Items */}
            <div className="space-y-1 mb-3 border-t border-white/5 pt-3">
                {order.items.slice(0, 3).map((item, i) => (
                    <p key={i} className="text-sm font-bold text-white/80 flex items-start gap-2">
                        <span className="text-[10px] font-black bg-white/10 rounded px-1.5 py-0.5 text-white shrink-0 mt-[2px]">{item.quantity}x</span>
                        <span className="leading-snug">{item.name}</span>
                    </p>
                ))}
                {order.items.length > 3 && (
                    <p className="text-xs font-bold text-text-muted italic">+{order.items.length - 3} item(s)</p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <PaymentBadge order={order} />
                <div className="text-right">
                    <p className="text-[10px] text-white/30 font-semibold">TOTAL</p>
                    <p className="text-lg font-black text-white">{formatCurrency(order.total_amount)}</p>
                </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-3 text-right">
                Ver Detalhes →
            </p>
        </Link>
    );
}

export default function Orders({ orders = [] }) {
    const { t, formatCurrency } = useI18n();
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [identity, setIdentity] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try { setIdentity(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    const handleIdentitySuccess = (customer) => {
        setIdentity(customer);
        setIsIdentityModalOpen(false);
        window.location.reload();
    };

    const handleProfileClose = (updatedCustomer) => {
        setIsProfileModalOpen(false);
        if (updatedCustomer !== undefined) {
            setIdentity(updatedCustomer);
            if (updatedCustomer === null) window.location.reload();
        }
    };

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white pb-32">
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5`}>
                <div className="flex items-center gap-4">
                    <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight">Meus Pedidos</h1>
                        {identity ? (
                            <p className="text-xs font-bold text-primary tracking-widest uppercase">Olá, {identity.name}</p>
                        ) : (
                            <p className="text-xs font-bold text-text-muted tracking-widest uppercase cursor-pointer" onClick={() => setIsIdentityModalOpen(true)}>Identifique-se</p>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-lg px-4 py-8">
                {!identity ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                            <span className="material-symbols-outlined text-4xl text-primary">account_circle</span>
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tight mb-2">Identifique-se</h2>
                        <p className="text-sm font-semibold text-text-muted max-w-[250px] mb-8">Informe seu número para ver o histórico de pedidos</p>
                        <button
                            onClick={() => setIsIdentityModalOpen(true)}
                            className="rounded-full bg-primary px-8 py-4 font-black uppercase tracking-widest text-[#0D0D12] hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(90,90,246,0.3)]"
                        >
                            Entrar com WhatsApp
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-white/20">receipt_long</span>
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tight mb-2">Nenhum pedido ainda</h2>
                        <p className="text-sm font-semibold text-text-muted max-w-[250px]">Seus pedidos aparecerão aqui assim que você fizer um</p>
                        <Link href="/menu" className="mt-8 rounded-full border border-white/20 px-8 py-4 font-black uppercase tracking-widest text-white hover:bg-white/5 hover:border-white/40 transition-all">
                            Ver Cardápio
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} t={t} formatCurrency={formatCurrency} />
                        ))}
                    </div>
                )}
            </div>

            <BottomNav onOpenProfile={() => setIsProfileModalOpen(true)} />
            <IdentityModal isOpen={isIdentityModalOpen} onClose={() => setIsIdentityModalOpen(false)} onSuccess={handleIdentitySuccess} />
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => handleProfileClose(undefined)} onSuccess={handleProfileClose} customer={identity} />
        </main>
    );
}
