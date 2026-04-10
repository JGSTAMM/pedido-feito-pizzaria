import { Link } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

export default function CartSheet({
    isOpen,
    onClose,
    items,
    cartTotal,
    cartItemCount,
    updateQuantity,
    removeItem,
    clearCart,
}) {
    const { t, formatCurrency } = useI18n();

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                onClick={onClose}
                aria-label={t('digital_menu.cart.close_cart')}
            />

            <aside className="absolute inset-x-0 bottom-0 h-[86vh] rounded-t-3xl border border-white/5 bg-surface/80 backdrop-blur-xl shadow-[0_-18px_48px_rgba(0,0,0,0.45)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0 md:border-r-0 md:border-b-0 md:shadow-[-18px_0_48px_rgba(0,0,0,0.45)]">
                <div className="flex h-full flex-col">
                    <header className="flex items-center justify-between gap-4 border-b border-white/5 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">{t('digital_menu.cart.title')}</h2>
                            <p className="mt-1 text-sm text-text-muted">
                                {t('digital_menu.cart.items_count', { count: cartItemCount })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
                        >
                            {t('digital_menu.cart.close_cart')}
                        </button>
                    </header>

                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                        {items.length === 0 ? (
                            <p className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-text-muted">
                                {t('digital_menu.cart.empty')}
                            </p>
                        ) : (
                            items.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white sm:text-base">{item.name}</h3>
                                            <p className="mt-1 text-xs text-text-muted">{formatCurrency(item.price)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-xs font-semibold uppercase tracking-wide text-red-300 transition-colors hover:text-red-200"
                                        >
                                            {t('digital_menu.cart.remove_item')}
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-base font-bold text-white transition-colors hover:bg-white/[0.1]"
                                        >
                                            {t('digital_menu.cart.decrease_quantity')}
                                        </button>
                                        <span className="min-w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-base font-bold text-white transition-colors hover:bg-white/[0.1]"
                                        >
                                            {t('digital_menu.cart.increase_quantity')}
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>

                    <footer className="sticky bottom-0 border-t border-white/5 bg-surface/90 px-5 pb-5 pt-4 backdrop-blur-xl sm:px-6 sm:pb-6">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-text-muted">{t('digital_menu.cart.subtotal')}</span>
                            <strong className="text-lg font-black text-white">{formatCurrency(cartTotal)}</strong>
                        </div>

                        <p className="mb-3 text-xs text-text-muted">{t('digital_menu.cart.minimum_order_hint')}</p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={clearCart}
                                className="h-11 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
                                disabled={items.length === 0}
                            >
                                {t('digital_menu.cart.clear_action')}
                            </button>
                            <Link
                                href="/menu/checkout"
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
                            >
                                {t('digital_menu.cart.sticky_checkout_cta')}
                            </Link>
                        </div>
                    </footer>
                </div>
            </aside>
        </div>
    );
}
