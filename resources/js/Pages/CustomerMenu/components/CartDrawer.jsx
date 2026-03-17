import { Link } from '@inertiajs/react';

export default function CartDrawer({
    isOpen,
    onClose,
    items,
    cartTotal,
    cartItemCount,
    updateQuantity,
    removeItem,
    clearCart,
    t,
    formatCurrency,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-label={t('digital_menu.cart.close_cart')}
            />

            <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-950 text-white shadow-2xl">
                <div className="flex h-full flex-col">
                    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                        <div>
                            <h2 className="text-lg font-semibold">{t('digital_menu.cart.title')}</h2>
                            <p className="text-xs text-slate-300">
                                {t('digital_menu.cart.items_count', { count: cartItemCount })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-slate-600 px-3 py-1 text-sm"
                        >
                            {t('digital_menu.cart.close_cart')}
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        {items.length === 0 ? (
                            <p className="text-sm text-slate-300">{t('digital_menu.cart.empty')}</p>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-lg border border-slate-700 bg-slate-900 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-medium">{item.name}</h3>
                                                <p className="text-xs text-slate-300">
                                                    {formatCurrency(item.price)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs text-red-300"
                                            >
                                                {t('digital_menu.cart.remove_item')}
                                            </button>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="rounded border border-slate-600 px-2 py-1 text-sm"
                                            >
                                                {t('digital_menu.cart.decrease_quantity')}
                                            </button>
                                            <span className="min-w-8 text-center text-sm font-semibold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="rounded border border-slate-600 px-2 py-1 text-sm"
                                            >
                                                {t('digital_menu.cart.increase_quantity')}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <footer className="border-t border-slate-800 px-4 py-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span>{t('digital_menu.cart.subtotal')}</span>
                            <strong>{formatCurrency(cartTotal)}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={clearCart}
                                className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
                                disabled={items.length === 0}
                            >
                                {t('digital_menu.cart.clear_action')}
                            </button>
                            <Link
                                href="/menu/checkout"
                                className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white"
                            >
                                {t('digital_menu.cart.checkout_action')}
                            </Link>
                        </div>
                    </footer>
                </div>
            </aside>
        </div>
    );
}
