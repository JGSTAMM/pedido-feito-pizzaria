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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity">
            <button
                type="button"
                className="absolute inset-0"
                onClick={onClose}
                aria-label={t('digital_menu.cart.close_cart')}
            />

            <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-900 shadow-2xl ring-1 ring-white/10 flex flex-col">
                <div className="flex h-full flex-col">
                    <header className="p-6 border-b border-gray-800 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">{t('digital_menu.cart.title')}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {t('digital_menu.cart.items_count', { count: cartItemCount })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            {t('digital_menu.cart.close_cart')}
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6">
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('digital_menu.cart.empty')}</p>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-gray-700 bg-gray-800/80 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatCurrency(item.price)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="text-xs text-red-300 hover:text-red-200 transition-colors"
                                            >
                                                {t('digital_menu.cart.remove_item')}
                                            </button>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="rounded-lg border border-gray-600 px-2.5 py-1.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                                            >
                                                {t('digital_menu.cart.decrease_quantity')}
                                            </button>
                                            <span className="min-w-8 text-center text-sm font-semibold text-white">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="rounded-lg border border-gray-600 px-2.5 py-1.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                                            >
                                                {t('digital_menu.cart.increase_quantity')}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <footer className="p-6 border-t border-gray-800 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('digital_menu.cart.subtotal')}</span>
                            <strong className="text-white text-base">{formatCurrency(cartTotal)}</strong>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={clearCart}
                                className="h-12 rounded-xl border border-gray-700 px-4 text-sm font-semibold text-gray-200 hover:bg-gray-800 transition-colors"
                                disabled={items.length === 0}
                            >
                                {t('digital_menu.cart.clear_action')}
                            </button>
                            <Link
                                href="/menu/checkout"
                                className="w-full h-12 inline-flex items-center justify-center rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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
