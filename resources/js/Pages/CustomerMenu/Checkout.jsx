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
        <main className="min-h-screen bg-gray-900 text-gray-100 py-8 lg:py-12">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
                <header className="mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{t('digital_menu.checkout.title')}</h1>
                    <p className="text-gray-400 mt-2">{t('digital_menu.checkout.subtitle')}</p>
                </header>

                <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
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
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                                <option value="pix">{t('digital_menu.checkout.payment_options.pix')}</option>
                                <option value="credit_card">{t('digital_menu.checkout.payment_options.credit_card')}</option>
                            </select>
                            {fieldErrors.paymentMethod ? (
                                <p className="mt-1 text-xs text-red-300">{fieldErrors.paymentMethod}</p>
                            ) : null}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                href="/menu"
                                className="h-12 inline-flex items-center justify-center px-4 rounded-xl border border-gray-700 text-white font-semibold hover:bg-gray-700/40 transition-colors"
                            >
                                {t('digital_menu.checkout.back_to_menu')}
                            </Link>
                            <button
                                type="submit"
                                disabled={isSubmitting || isCartEmpty}
                                className="h-12 px-6 inline-flex items-center justify-center rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? t('digital_menu.checkout.submitting_order')
                                    : t('digital_menu.checkout.submit_order')}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-xs text-gray-500">{checkoutEndpoint}</p>
                </section>

                <aside className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold">{t('digital_menu.checkout.order_summary_title')}</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        {t('digital_menu.cart.items_count', { count: cartItemCount })}
                    </p>

                    <div className="mt-4 space-y-3">
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('digital_menu.checkout.empty_cart_message')}</p>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-700 p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-400">
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

                    <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
                        <span className="text-sm text-gray-400">{t('digital_menu.cart.total')}</span>
                        <strong className="text-base">{formatCurrency(cartTotal)}</strong>
                    </div>
                </aside>
            </div>
        </main>
    );
}
