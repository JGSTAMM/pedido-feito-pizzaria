import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';
import BottomNav from './components/navigation/BottomNav';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

export default function Orders({ orders = [] }) {
    const { t, formatCurrency } = useI18n();
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [identity, setIdentity] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try {
                setIdentity(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleIdentitySuccess = (customer) => {
        setIdentity(customer);
        setIsIdentityModalOpen(false);
        // After identifying, the page needs to reload to fetch orders for the new phone.
        window.location.reload();
    };

    const handleProfileClose = (updatedCustomer) => {
        setIsProfileModalOpen(false);
        if (updatedCustomer !== undefined) {
            setIdentity(updatedCustomer);
            if (updatedCustomer === null) { // logged out
                window.location.reload();
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'preparing': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
            case 'ready': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            case 'delivered': return 'bg-white/10 text-white border border-white/20';
            case 'cancelled': return 'bg-red-500/20 text-red-500 border border-red-500/30';
            default: return 'bg-white/5 text-text-muted';
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: t('digital_menu.orders.status.pending'),
            preparing: t('digital_menu.orders.status.preparing'),
            ready: t('digital_menu.orders.status.ready'),
            delivered: t('digital_menu.orders.status.delivered'),
            cancelled: t('digital_menu.orders.status.cancelled')
        };
        return labels[status] || t('common.unknown');
    };

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white pb-32">
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5`}>
                <div className="flex items-center gap-4">
                    <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight">{t('digital_menu.orders.title')}</h1>
                        {identity ? (
                            <p className="text-xs font-bold text-primary tracking-widest uppercase">{t('digital_menu.orders.greeting', { name: identity.name })}</p>
                        ) : (
                            <p className="text-xs font-bold text-text-muted tracking-widest uppercase cursor-pointer" onClick={() => setIsIdentityModalOpen(true)}>{t('digital_menu.orders.identify_yourself')}</p>
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
                        <h2 className="text-2xl font-black italic tracking-tight mb-2">{t('digital_menu.orders.identify_section_title')}</h2>
                        <p className="text-sm font-semibold text-text-muted max-w-[250px] mb-8">
                            {t('digital_menu.orders.identify_section_desc')}
                        </p>
                        <button
                            onClick={() => setIsIdentityModalOpen(true)}
                            className="rounded-full bg-primary px-8 py-4 font-black uppercase tracking-widest text-[#0D0D12] hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(90,90,246,0.3)]"
                        >
                            {t('digital_menu.orders.login_with_whatsapp')}
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-white/20">receipt_long</span>
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tight mb-2">{t('digital_menu.orders.empty_title')}</h2>
                        <p className="text-sm font-semibold text-text-muted max-w-[250px]">
                            {t('digital_menu.orders.empty_desc')}
                        </p>
                        <Link
                            href="/menu"
                            className="mt-8 rounded-full border border-white/20 px-8 py-4 font-black uppercase tracking-widest text-white hover:bg-white/5 hover:border-white/40 transition-all"
                        >
                            {t('digital_menu.orders.view_menu')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <Link
                                href={`/menu/order/${order.id}/status`}
                                key={order.id}
                                className={`${luccheseMenuTheme.glass} block rounded-3xl p-5 hover:border-primary/30 hover:scale-[1.01] transition-all animate-in slide-in-from-bottom-4 duration-300`}
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                            >
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            {t('digital_menu.orders.order_label')} <span className="text-white">#{order.order_code}</span>
                                        </p>
                                        <p className="text-xs font-semibold text-white/40 mt-0.5">{order.created_at_formatted}</p>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    {order.items.slice(0, 3).map((item, i) => (
                                        <p key={i} className="text-sm font-bold text-white/80 flex items-center gap-2">
                                            <span className="text-[10px] font-black bg-white/10 rounded px-1.5 py-0.5 text-white">{item.quantity}x</span>
                                            {item.name}
                                        </p>
                                    ))}
                                    {order.items.length > 3 && (
                                        <p className="text-xs font-bold text-text-muted italic">{t('digital_menu.orders.and_more_items', { count: order.items.length - 3 })}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <p className="text-xs font-black uppercase tracking-widest text-primary">{t('digital_menu.orders.view_details')}</p>
                                    <p className="text-lg font-black">{formatCurrency(order.total)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav onOpenProfile={() => setIsProfileModalOpen(true)} />

            <IdentityModal
                isOpen={isIdentityModalOpen}
                onClose={() => setIsIdentityModalOpen(false)}
                onSuccess={handleIdentitySuccess}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => handleProfileClose(undefined)}
                onSuccess={handleProfileClose}
                customer={identity}
            />
        </main>
    );
}
