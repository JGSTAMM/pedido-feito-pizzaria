import React, { useEffect, useRef, useState } from 'react';
import useI18n from '@/hooks/useI18n';

const CreditCardForm = ({ onTokenReceived, onTokenError, amount, payerEmail }) => {
    const { t } = useI18n();
    const cardFormRef = useRef(null);
    const mountedRef = useRef(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const scriptId = 'mercadopago-sdk-js';
        let isCancelled = false;

        const initCardForm = () => {
            if (isCancelled) return;

            if (!window.MercadoPago) {
                setError(t('digital_menu.checkout.card_form.sdk_error'));
                setIsLoading(false);
                return;
            }

            const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
            if (!publicKey) {
                console.error('Mercado Pago Public Key missing in .env');
                setError(t('digital_menu.checkout.card_form.sdk_error'));
                setIsLoading(false);
                return;
            }

            // Unmount previous instance if exists
            if (cardFormRef.current) {
                try { cardFormRef.current.unmount(); } catch (_) { }
                cardFormRef.current = null;
            }

            try {
                const mp = new window.MercadoPago(publicKey);

                cardFormRef.current = mp.cardForm({
                    amount: String(amount || '0'),
                    iframe: true,
                    form: {
                        id: 'form-checkout',
                        cardNumber: {
                            id: 'form-checkout__cardNumber',
                            placeholder: '0000 0000 0000 0000',
                            style: { color: '#FFFFFF', fontWeight: '500', padding: '0 16px', fontSize: '16px' }
                        },
                        expirationDate: {
                            id: 'form-checkout__expirationDate',
                            placeholder: 'MM/AA',
                            style: { color: '#FFFFFF', fontWeight: '500', padding: '0 16px', fontSize: '16px' }
                        },
                        securityCode: {
                            id: 'form-checkout__securityCode',
                            placeholder: 'CVV',
                            style: { color: '#FFFFFF', fontWeight: '500', padding: '0 16px', fontSize: '16px' }
                        },
                        cardholderName: {
                            id: 'form-checkout__cardholderName',
                            placeholder: t('digital_menu.checkout.card_form.cardholder_name'),
                        },
                        issuer: {
                            id: 'form-checkout__issuer',
                            placeholder: 'Banco',
                        },
                        installments: {
                            id: 'form-checkout__installments',
                            placeholder: '1x',
                        },
                        identificationType: {
                            id: 'form-checkout__identificationType',
                            placeholder: 'CPF',
                        },
                        identificationNumber: {
                            id: 'form-checkout__identificationNumber',
                            placeholder: '000.000.000-00',
                        },
                        cardholderEmail: {
                            id: 'form-checkout__cardholderEmail',
                            placeholder: 'E-mail',
                        },
                    },
                    callbacks: {
                        onFormMounted: (err) => {
                            if (isCancelled) return;
                            if (err) {
                                console.warn('Form mount error:', err);
                                setError(t('digital_menu.checkout.card_form.sdk_error'));
                            }
                            mountedRef.current = true;
                            setIsLoading(false);
                        },
                        onSubmit: (event) => {
                            if (event) event.preventDefault();
                            if (!cardFormRef.current) return;

                            console.log('MP cardForm onSubmit disparado com sucesso!');

                            try {
                                const formData = typeof cardFormRef.current.getCardFormData === 'function'
                                    ? cardFormRef.current.getCardFormData()
                                    : cardFormRef.current.getFormData();

                                console.log('MercadoPago Token gerado:', formData.token ? 'SIM' : 'NÃO');

                                onTokenReceived({
                                    token: formData.token,
                                    installments: 1, // Always 1 for food orders
                                    paymentMethodId: formData.paymentMethodId,
                                    issuerId: formData.issuerId,
                                    payerEmail: formData.cardholderEmail,
                                });
                            } catch (e) {
                                console.error('Erro ao extrair form data do MP SDK:', e);
                                if (typeof onTokenError === 'function') onTokenError(e);
                            }
                        },
                        onError: (err) => {
                            console.error('MP CardForm error:', err);
                            if (typeof onTokenError === 'function') {
                                onTokenError(err);
                            }
                        }
                    }
                });
            } catch (err) {
                console.error('MP CardForm Init Error:', err);
                if (!isCancelled) {
                    setError(t('digital_menu.checkout.card_form.sdk_error'));
                    setIsLoading(false);
                }
            }
        };

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = initCardForm;
            script.onerror = () => {
                if (!isCancelled) {
                    setError(t('digital_menu.checkout.card_form.sdk_error'));
                    setIsLoading(false);
                }
            };
            document.body.appendChild(script);
        } else if (window.MercadoPago) {
            initCardForm();
        }

        return () => {
            isCancelled = true;
            if (cardFormRef.current && mountedRef.current) {
                try { cardFormRef.current.unmount(); } catch (_) { }
            }
            cardFormRef.current = null;
            mountedRef.current = false;
            delete window.submitMPCardForm;
        };
    }, []);

    // Expose global submit trigger
    useEffect(() => {
        window.submitMPCardForm = () => {
            console.log('Chamando submitMPCardForm via click de Checkout...');
            if (cardFormRef.current) {
                const form = document.getElementById('form-checkout');
                if (form) {
                    console.log('Disparando form.requestSubmit() para iniciar tokenização...');
                    if (typeof form.requestSubmit === 'function') {
                        form.requestSubmit();
                    } else {
                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                } else {
                    console.error('Formulário #form-checkout não encontrado!');
                }
            } else {
                console.error('cardFormRef.current não está definido!');
            }
        };
        return () => { delete window.submitMPCardForm; };
    }, []);

    return (
        <div className="mt-6 p-5 rounded-3xl bg-white/10 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                </div>
                {t('digital_menu.checkout.card_form.billing_section_title')}
            </h3>

            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-100 text-sm">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-white/40 text-sm font-medium tracking-wide uppercase">{t('digital_menu.checkout.card_form.loading_sdk')}</p>
                </div>
            )}

            <form id="form-checkout" className={`space-y-5 ${isLoading ? 'hidden' : 'block'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-full">
                        <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__cardNumber">
                            {t('digital_menu.checkout.card_form.card_number')}
                        </label>
                        <div id="form-checkout__cardNumber" className="h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:bg-white/10 transition-all relative"></div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__expirationDate">
                            {t('digital_menu.checkout.card_form.expiration')}
                        </label>
                        <div id="form-checkout__expirationDate" className="h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:bg-white/10 transition-all relative"></div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__securityCode">
                            {t('digital_menu.checkout.card_form.security_code')}
                        </label>
                        <div id="form-checkout__securityCode" className="h-[56px] rounded-2xl bg-white/5 border border-white/10 text-white focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:bg-white/10 transition-all relative"></div>
                    </div>

                    <div className="col-span-full">
                        <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__cardholderName">
                            {t('digital_menu.checkout.card_form.cardholder_name')}
                        </label>
                        <input type="text" id="form-checkout__cardholderName" className="w-full h-[52px] px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-inner" />
                    </div>

                    {/* Hidden fields required by MP SDK */}
                    <select id="form-checkout__issuer" className="hidden"></select>
                    <select id="form-checkout__installments" className="hidden"></select>

                    <div className="flex flex-col sm:flex-row gap-5 col-span-full">
                        <div className="sm:w-1/3">
                            <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__identificationType">
                                {t('digital_menu.checkout.card_form.identification_type')}
                            </label>
                            <div className="relative">
                                <select id="form-checkout__identificationType" className="w-full h-[52px] px-4 rounded-2xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer pr-10 appearance-none"></select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="sm:w-2/3">
                            <label className="block text-xs font-medium text-white/40 uppercase mb-2 ml-1 tracking-wider" htmlFor="form-checkout__identificationNumber">
                                {t('digital_menu.checkout.card_form.identification_number')}
                            </label>
                            <input type="text" id="form-checkout__identificationNumber" className="w-full h-[52px] px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-inner" />
                        </div>
                    </div>

                    <input type="email" id="form-checkout__cardholderEmail" defaultValue={payerEmail} className="hidden" />
                </div>

                <button type="submit" id="form-checkout__submit" className="hidden">Submit</button>
            </form>

            <style dangerouslySetInnerHTML={{
                __html: `
                #form-checkout__cardNumber iframe,
                #form-checkout__expirationDate iframe,
                #form-checkout__securityCode iframe {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    outline: none !important;
                    display: block !important;
                }
            `}} />
        </div>
    );
};

export default CreditCardForm;
