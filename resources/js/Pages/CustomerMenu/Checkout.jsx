import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';

export default function Checkout() {
    const { t, formatCurrency } = useI18n();
    const { checkoutEndpoint } = usePage().props;
    const { items, clearCart, cartTotal, cartItemCount } = useCart();
    const {
        formValues,
        fieldErrors,
        submitError,
        isSubmitting,
        isCartEmpty,
        updateField,
        handleSubmit,
    } = useCheckout({ items, clearCart, t });

    return (
        <main className="min-h-screen bg-background-dark text-white p-6">
            <header className="max-w-4xl mx-auto mb-6">
                <h1 className="text-3xl font-bold">{t('digital_menu.checkout.title')}</h1>
                <p className="text-text-muted mt-2">{t('digital_menu.checkout.subtitle')}</p>
            </header>

            <div className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="rounded-xl border border-border-subtle bg-surface p-4">
                    <h2 className="text-xl font-semibold">{t('digital_menu.checkout.form_title')}</h2>

                    {submitError ? (
                        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                            {submitError}
                        </p>
                    ) : null}

                    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="customerName">
                                {t('digital_menu.checkout.customer_name')}
                            </label>
                            <input
                                id="customerName"
                                type="text"
                                value={formValues.customerName}
                                onChange={(event) => updateField('customerName', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.customer_name')}
                                className="w-full rounded-lg border border-border-subtle bg-background-dark px-3 py-2 text-white"
                            />
                            {fieldErrors.customerName ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.customerName}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="customerPhone">
                                {t('digital_menu.checkout.customer_phone')}
                            </label>
                            <input
                                id="customerPhone"
                                type="text"
                                value={formValues.customerPhone}
                                onChange={(event) => updateField('customerPhone', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.customer_phone')}
                                className="w-full rounded-lg border border-border-subtle bg-background-dark px-3 py-2 text-white"
                            />
                            {fieldErrors.customerPhone ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.customerPhone}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="payerEmail">
                                {t('digital_menu.checkout.payer_email')}
                            </label>
                            <input
                                id="payerEmail"
                                type="email"
                                value={formValues.payerEmail}
                                onChange={(event) => updateField('payerEmail', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.payer_email')}
                                className="w-full rounded-lg border border-border-subtle bg-background-dark px-3 py-2 text-white"
                            />
                            {fieldErrors.payerEmail ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.payerEmail}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="deliveryAddress">
                                {t('digital_menu.checkout.delivery_address')}
                            </label>
                            <input
                                id="deliveryAddress"
                                type="text"
                                value={formValues.deliveryAddress}
                                onChange={(event) => updateField('deliveryAddress', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.delivery_address')}
                                className="w-full rounded-lg border border-border-subtle bg-background-dark px-3 py-2 text-white"
                            />
                            {fieldErrors.deliveryAddress ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.deliveryAddress}</p>
                            ) : null}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium" htmlFor="paymentMethod">
                                {t('digital_menu.checkout.payment_method')}
                            </label>
                            <select
                                id="paymentMethod"
                                value={formValues.paymentMethod}
                                onChange={(event) => updateField('paymentMethod', event.target.value)}
                                className="w-full rounded-lg border border-border-subtle bg-background-dark px-3 py-2 text-white"
                            >
                                <option value="pix">{t('digital_menu.checkout.payment_options.pix')}</option>
                                <option value="credit_card">{t('digital_menu.checkout.payment_options.credit_card')}</option>
                            </select>
                            {fieldErrors.paymentMethod ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.paymentMethod}</p>
                            ) : null}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Link
                                href="/menu"
                                className="px-4 py-2 rounded-lg border border-border-subtle text-white font-semibold"
                            >
                                {t('digital_menu.checkout.back_to_menu')}
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || isCartEmpty}
                                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? t('digital_menu.checkout.submitting_order')
                                    : t('digital_menu.checkout.submit_order')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-xs text-text-muted">{checkoutEndpoint}</p>
                </section>

                <aside className="rounded-xl border border-border-subtle bg-surface p-4 h-fit">
                    <h2 className="text-xl font-semibold">{t('digital_menu.checkout.order_summary_title')}</h2>
                    <p className="mt-1 text-sm text-text-muted">
                        {t('digital_menu.cart.items_count', { count: cartItemCount })}
                    </p>

                    <div className="mt-4 space-y-3">
                        {items.length === 0 ? (
                            <p className="text-sm text-text-muted">{t('digital_menu.checkout.empty_cart_message')}</p>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-text-muted">
                                            {t('digital_menu.checkout.item_quantity', { count: item.quantity })}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4">
                        <span className="text-sm text-text-muted">{t('digital_menu.cart.total')}</span>
                        <strong className="text-base">{formatCurrency(cartTotal)}</strong>
                    </div>
                </aside>
            </div>

        </main>
    );
}
