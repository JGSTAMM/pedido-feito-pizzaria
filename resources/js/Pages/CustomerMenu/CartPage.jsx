import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';
import BottomNav from './components/navigation/BottomNav';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

export default function CartPage() {
    const { t, formatCurrency } = useI18n();
    const { items, updateQuantity, removeItem, cartTotal, cartItemCount } = useCart();

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

    const handleCheckoutClick = () => {
        if (!identity) {
            setIsIdentityModalOpen(true);
        } else {
            router.visit('/menu/checkout');
        }
    };

    const handleIdentitySuccess = (customer) => {
        setIdentity(customer);
        setIsIdentityModalOpen(false);
        // After identity is confirmed, redirect to checkout
        setTimeout(() => {
            router.visit('/menu/checkout');
        }, 300);
    };

    const handleProfileClose = (updatedCustomer) => {
        setIsProfileModalOpen(false);
        if (updatedCustomer !== undefined) {
            setIdentity(updatedCustomer); // could be null if logged out
        }
    };

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white pb-64">
            {/* Header */}
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5`}>
                <div className="flex items-center gap-4">
                    <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight">{t('digital_menu.cart.title')}</h1>
                        {identity && (
                            <p className="text-xs font-bold text-primary tracking-widest uppercase">{t('digital_menu.checkout.greeting', { name: identity.name }) || `Olá, ${identity.name}`}</p>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-lg px-4 py-8">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-white/20">shopping_bag</span>
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tight mb-2">{t('digital_menu.cart.empty_title') || 'Carrinho Vazio'}</h2>
                        <p className="text-sm font-semibold text-text-muted max-w-[250px]">
                            {t('digital_menu.cart.empty_message') || 'Você ainda não adicionou nenhum item. Que tal explorar nosso cardápio?'}
                        </p>
                        <Link
                            href="/menu"
                            className="mt-8 rounded-full bg-primary px-8 py-4 font-black uppercase tracking-widest text-[#0D0D12] hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(90,90,246,0.3)]"
                        >
                            {t('digital_menu.cart.view_menu') || 'Ver Cardápio'}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`${luccheseMenuTheme.glass} rounded-3xl p-4 flex gap-4 animate-in slide-in-from-bottom-4 duration-300`}
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                                >
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-2xl object-cover border border-white/10" />
                                    ) : (
                                        <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                            <span className="material-symbols-outlined text-white/20">restaurant</span>
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-white leading-tight">{item.name}</h3>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-text-muted hover:text-red-400 p-1"
                                                aria-label={t('digital_menu.cart.remove_item')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <p className="text-sm font-black text-white">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>

                                            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.02]">
                                                <button
                                                    className="flex h-8 w-8 items-center justify-center text-white/70 hover:text-white"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    aria-label={t('digital_menu.cart.decrease_quantity')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                </button>
                                                <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                                <button
                                                    className="flex h-8 w-8 items-center justify-center text-white/70 hover:text-white"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    aria-label={t('digital_menu.cart.increase_quantity')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 mt-8 space-y-4`}>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-4">{t('digital_menu.checkout.summary')}</h3>

                            <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                                <span>{t('digital_menu.cart.subtotal')}</span>
                                <span>{formatCurrency(cartTotal)}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                                <span>{t('digital_menu.checkout.delivery_fee')}</span>
                                <span className="text-[10px] uppercase tracking-widest text-[#06b6d4]">{t('digital_menu.checkout.to_calculate')}</span>
                            </div>

                            <hr className="border-white/10 my-4" />

                            <div className="flex items-center justify-between text-lg font-black text-white">
                                <span>{t('digital_menu.cart.total')}</span>
                                <span>{formatCurrency(cartTotal)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckoutClick}
                            className="w-full rounded-full bg-primary py-5 font-black uppercase tracking-[0.15em] text-[#0D0D12] text-xs hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(90,90,246,0.35)]"
                        >
                            {t('digital_menu.checkout.submit_order') || 'Finalizar Pedido'}
                        </button>

                        <Link
                            href="/menu"
                            className="w-full mt-4 block text-center rounded-full bg-white/5 py-4 font-bold border border-white/10 uppercase tracking-widest text-white text-xs hover:bg-white/10 transition-colors"
                        >
                            {t('digital_menu.cart.continue_shopping')}
                        </Link>
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
