import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';
import CheckoutFormPremium from './components/checkout/CheckoutFormPremium';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';
import { useEffect, useState } from 'react';

export default function Checkout() {
    const { t, formatCurrency } = useI18n();
    const { checkoutEndpoint } = usePage().props;
    const { items, clearCart, cartTotal, cartItemCount } = useCart();

    const { data: catalogData, isLoading: isCatalogLoading, error: catalogLoadFailed, refetch: retryLoadCatalog } = useDigitalMenuQuery();

    // Merge phone and identity from localStorage automatically
    const [initialValues, setInitialValues] = useState({});

    useEffect(() => {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try {
                const identity = JSON.parse(stored);
                setInitialValues({
                    customerName: identity.name || '',
                    customerPhone: identity.phone || '',
                });
            } catch (e) { }
        }
    }, []);

    const {
        formValues,
        fieldErrors,
        submitError,
        isSubmitting,
        isCartEmpty,
        updateField,
        handleSubmit,
    } = useCheckout({ items, clearCart, t, initialValues });

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white pb-20">
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center gap-4 px-6 py-4 border-b border-white/5`}>
                <Link href="/menu/cart" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </Link>
                <div>
                    <h1 className="text-xl font-black italic tracking-tight">{t('digital_menu.checkout.title')}</h1>
                    <p className="text-xs font-bold text-primary tracking-widest uppercase">{t('digital_menu.checkout.subtitle')}</p>
                </div>
            </header>

            <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
                <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="material-symbols-outlined text-8xl">shopping_cart_checkout</span>
                    </div>

                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-6">
                        {t('digital_menu.checkout.order_info')}
                    </h2>

                    <CheckoutFormPremium
                        formValues={formValues}
                        fieldErrors={fieldErrors}
                        submitError={submitError}
                        isCatalogLoading={isCatalogLoading}
                        catalogLoadFailed={catalogLoadFailed}
                        retryLoadCatalog={retryLoadCatalog}
                        updateField={updateField}
                        setFulfillmentType={(type) => updateField('fulfillmentType', type)}
                        neighborhoods={catalogData?.neighborhoods || []}
                        tables={catalogData?.tables || []}
                        handleSubmit={(e) => {
                            // Ensure the submit handles the event properly
                            handleSubmit(e);
                        }}
                    />
                </div>

                <div className={`${luccheseMenuTheme.glass} rounded-3xl p-6 mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both`}>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic mb-4">{t('digital_menu.checkout.summary')}</h3>

                    <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                        <span>{t('digital_menu.cart.subtotal')} ({cartItemCount} {cartItemCount === 1 ? t('orders.table.itemSingular') : t('orders.table.itemPlural')})</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm font-bold text-text-muted">
                        <span>{t('digital_menu.checkout.delivery_fee')}</span>
                        {formValues.fulfillmentType === 'delivery' ? (
                            <span className="text-emerald-400">{t('digital_menu.checkout.to_calculate')}</span>
                        ) : (
                            <span className="text-emerald-400">{t('digital_menu.checkout.free')}</span>
                        )}
                    </div>

                    <hr className="border-white/10 my-4" />

                    <div className="flex items-center justify-between text-lg font-black text-white">
                        <span>{t('digital_menu.checkout.partial_total')}</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>
                </div>

                <div className="pt-4 animate-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isCartEmpty}
                        className="w-full rounded-full bg-primary py-5 font-black uppercase tracking-[0.15em] text-[#0D0D12] text-xs hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(90,90,246,0.35)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                    >
                        {isSubmitting
                            ? t('digital_menu.checkout.submitting_order')
                            : t('digital_menu.checkout.submit_order')}
                    </button>
                    {!isSubmitting && isCartEmpty && (
                        <p className="text-center text-xs text-red-400 mt-4 font-bold">{t('digital_menu.checkout.empty_cart_message')}</p>
                    )}
                </div>
            </div>
        </main>
    );
}
