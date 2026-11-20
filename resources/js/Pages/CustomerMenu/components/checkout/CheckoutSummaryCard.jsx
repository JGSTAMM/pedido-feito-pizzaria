import { Link } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function CheckoutSummaryCard({
    items,
    cartTotal,
    cartItemCount,
    isSubmitting,
    isCartEmpty,
    onSubmitIntent,
}) {
    const { t, formatCurrency } = useI18n();

    const serviceFee = 0;
    const deliveryFee = 0;
    const finalTotal = cartTotal + serviceFee + deliveryFee;

    return (
        <aside className={`${luccheseMenuTheme.glass} fixed inset-x-4 bottom-4 z-30 rounded-3xl p-4 sm:inset-x-6 sm:p-5 lg:static lg:inset-auto lg:bottom-auto lg:z-auto lg:p-6 lg:sticky lg:top-6`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                {t('digital_menu.checkout.review_section_title')}
            </h3>

            <p className="mt-1 text-sm text-text-muted">
                {t('digital_menu.cart.items_count', { count: cartItemCount })}
            </p>

            <div className="mt-4 hidden max-h-52 space-y-2 overflow-y-auto pr-1 sm:block">
                {items.length === 0 ? (
                    <p className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm text-text-muted">
                        {t('digital_menu.checkout.empty_cart_message')}
                    </p>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                                <p className="text-xs text-text-muted">
                                    {t('digital_menu.checkout.item_quantity', { count: item.quantity })}
                                </p>
                            </div>
                            <p className="text-sm font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm">
                <div className="flex items-center justify-between text-text-muted">
                    <span>{t('digital_menu.cart.subtotal')}</span>
                    <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="hidden items-center justify-between text-text-muted sm:flex">
                    <span>{t('digital_menu.checkout.fees.service_fee')}</span>
                    <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="hidden items-center justify-between text-text-muted sm:flex">
                    <span>{t('digital_menu.checkout.fees.delivery_fee')}</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 text-base font-black text-white">
                    <span>{t('digital_menu.cart.total')}</span>
                    <span>{formatCurrency(finalTotal)}</span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:mt-5 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                    href="/menu"
                    className="hidden h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
                >
                    {t('digital_menu.checkout.back_to_menu')}
                </Link>
                <button
                    type="submit"
                    form="checkout-form-premium"
                    disabled={isSubmitting || isCartEmpty}
                    onMouseEnter={onSubmitIntent}
                    onFocus={onSubmitIntent}
                    onTouchStart={onSubmitIntent}
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark disabled:opacity-60"
                >
                    {isSubmitting
                        ? t('digital_menu.checkout.submitting_order')
                        : t('digital_menu.checkout.submit_order')}
                </button>
            </div>
        </aside>
    );
}
