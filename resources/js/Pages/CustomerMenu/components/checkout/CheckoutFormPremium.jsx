import { useEffect, useMemo, useRef, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import AddressSelector from './AddressSelector';
import NeighborhoodSearchSelect from '../shared/NeighborhoodSearchSelect';
import CreditCardForm from './CreditCardForm';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

const PAYMENT_OPTIONS = [
    { key: 'pix', icon: 'qr_code_2', enabled: true },
    { key: 'credit_card', icon: 'credit_card', enabled: true },
    { key: 'cash', icon: 'payments', enabled: true },
];

function FieldError({ message }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export default function CheckoutFormPremium({
    formValues,
    fieldErrors,
    submitError,
    isCatalogLoading,
    catalogLoadFailed,
    retryLoadCatalog,
    updateField,
    setFulfillmentType,
    neighborhoods,
    tables,
    storeSetting,
    handleSubmit,
    handleCreditCardToken,
    handleCreditCardError,
    totalAmount,
}) {
    const { t } = useI18n();
    const fulfillmentType = formValues.fulfillmentType || 'pickup';
    const [isScanningQr, setIsScanningQr] = useState(false);
    const [qrFeedbackKey, setQrFeedbackKey] = useState('');
    const [qrErrorKey, setQrErrorKey] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scanActiveRef = useRef(false);

    const activePaymentOptions = useMemo(() => {
        const allowedMethods = storeSetting?.payment_methods || [];
        const normalizedMethods = allowedMethods.map(m => String(m).toLowerCase().trim());

        return PAYMENT_OPTIONS.map(opt => {
            let isEnabled = false;

            if (opt.key === 'pix' && normalizedMethods.includes('pix')) {
                isEnabled = true;
            } else if (opt.key === 'credit_card' && (normalizedMethods.includes('cartão de crédito') || normalizedMethods.includes('credit_card') || normalizedMethods.includes('credito') || normalizedMethods.includes('crédito'))) {
                isEnabled = true;
            } else if (opt.key === 'debit_card' && (normalizedMethods.includes('cartão de débito') || normalizedMethods.includes('debit_card') || normalizedMethods.includes('debito') || normalizedMethods.includes('débito'))) {
                isEnabled = true;
            } else if (opt.key === 'cash' && (normalizedMethods.includes('dinheiro') || normalizedMethods.includes('cash'))) {
                isEnabled = true;
            } else if (normalizedMethods.includes(opt.key)) {
                isEnabled = true;
            }

            return { ...opt, enabled: isEnabled };
        });
    }, [storeSetting]);

    const tableMapByName = useMemo(() => {
        const map = new Map();

        (tables || []).forEach((table) => {
            map.set(String(table.name || '').toLowerCase(), table);
        });

        return map;
    }, [tables]);

    const fieldClassName = `w-full rounded-xl border border-white/10 bg-[#13131A] px-4 py-3 text-sm text-white placeholder:text-text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/25`;

    const stopQrScanner = () => {
        scanActiveRef.current = false;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsScanningQr(false);
    };

    const getTableCodeFromRawValue = (rawValue) => {
        const trimmedValue = String(rawValue || '').trim();

        if (!trimmedValue) {
            return '';
        }

        try {
            const parsedUrl = new URL(trimmedValue);
            const fromQuery = parsedUrl.searchParams.get('table') || parsedUrl.searchParams.get('mesa');
            return fromQuery ? String(fromQuery).trim() : trimmedValue;
        } catch {
            return trimmedValue;
        }
    };

    const applyDetectedTableCode = (rawCode) => {
        const detectedCode = getTableCodeFromRawValue(rawCode);

        if (!detectedCode) {
            return false;
        }

        updateField('tableCode', detectedCode);

        const normalizedCode = detectedCode.toLowerCase();
        const matchedTable = tableMapByName.get(normalizedCode);

        if (matchedTable) {
            updateField('tableId', matchedTable.id);
        }

        setQrFeedbackKey('digital_menu.checkout.table_qr.scan_success');
        setQrErrorKey('');
        return true;
    };

    const startQrScanner = async () => {
        setQrFeedbackKey('');
        setQrErrorKey('');

        if (!('mediaDevices' in navigator) || !navigator.mediaDevices?.getUserMedia) {
            setQrErrorKey('digital_menu.checkout.table_qr.camera_unavailable');
            return;
        }

        if (!('BarcodeDetector' in window)) {
            setQrErrorKey('digital_menu.checkout.table_qr.scanner_unavailable');
            return;
        }

        try {
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                },
                audio: false,
            });

            streamRef.current = stream;
            scanActiveRef.current = true;
            setIsScanningQr(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            const readFrame = async () => {
                if (!scanActiveRef.current) {
                    return;
                }

                if (!videoRef.current) {
                    window.requestAnimationFrame(readFrame);
                    return;
                }

                const barcodes = await detector.detect(videoRef.current);
                const qrCode = barcodes?.[0]?.rawValue;

                if (qrCode && applyDetectedTableCode(qrCode)) {
                    stopQrScanner();
                    return;
                }

                window.requestAnimationFrame(readFrame);
            };

            window.requestAnimationFrame(readFrame);
        } catch {
            stopQrScanner();
            setQrErrorKey('digital_menu.checkout.table_qr.scan_failed');
        }
    };

    useEffect(() => {
        return () => {
            stopQrScanner();
        };
    }, []);

    return (
        <section className="w-full">
            <header className="mb-5 border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white">{t('digital_menu.checkout.form_title')}</h2>
                <p className="mt-1 text-sm text-text-muted">{t('digital_menu.checkout.subtitle')}</p>
            </header>

            {submitError ? (
                <p role="alert" className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200">
                    {submitError}
                </p>
            ) : null}

            {isCatalogLoading ? (
                <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-text-muted" aria-live="polite" role="status">
                    {t('digital_menu.checkout.catalog_loading')}
                </p>
            ) : null}

            {catalogLoadFailed ? (
                <div className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
                    <p>{t('digital_menu.checkout.catalog_load_failed')}</p>
                    <button
                        type="button"
                        onClick={retryLoadCatalog}
                        className="mt-2 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                    >
                        {t('digital_menu.actions.retry')}
                    </button>
                </div>
            ) : null}

            <div
                className="space-y-8 mt-6"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                        if (handleSubmit) handleSubmit(e);
                    }
                }}
            >
                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                        {t('digital_menu.checkout.contact_section_title')}
                    </h3>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="customerName">
                            {t('digital_menu.checkout.customer_name')}
                        </label>
                        <input
                            id="customerName"
                            type="text"
                            value={formValues.customerName}
                            onChange={(event) => updateField('customerName', event.target.value)}
                            placeholder={t('digital_menu.checkout.placeholders.customer_name')}
                            autoComplete="name"
                            aria-invalid={Boolean(fieldErrors.customerName)}
                            className={fieldClassName}
                        />
                        <FieldError message={fieldErrors.customerName} />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="customerPhone">
                                {t('digital_menu.checkout.customer_phone')}
                            </label>
                            <input
                                id="customerPhone"
                                type="text"
                                value={formValues.customerPhone}
                                onChange={(event) => updateField('customerPhone', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.customer_phone')}
                                autoComplete="tel"
                                inputMode="tel"
                                aria-invalid={Boolean(fieldErrors.customerPhone)}
                                className={fieldClassName}
                            />
                            <FieldError message={fieldErrors.customerPhone} />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="payerEmail">
                                {t('digital_menu.checkout.payer_email')} <span className="text-[10px] font-normal opacity-70">({t('digital_menu.checkout.optional_promo_warning') || 'Opcional - Receber promoções'})</span>
                            </label>
                            <input
                                id="payerEmail"
                                type="email"
                                value={formValues.payerEmail}
                                onChange={(event) => updateField('payerEmail', event.target.value)}
                                placeholder={t('digital_menu.checkout.placeholders.payer_email')}
                                autoComplete="email"
                                aria-invalid={Boolean(fieldErrors.payerEmail)}
                                className={fieldClassName}
                            />
                            <FieldError message={fieldErrors.payerEmail} />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                        {t('digital_menu.checkout.delivery_section_title')}
                    </h3>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setFulfillmentType('dine_in')}
                            className={`min-h-[44px] h-auto flex flex-col items-center justify-center rounded-2xl border px-1 py-1.5 text-[10px] leading-[1.15] text-center outline-none focus:outline-none focus:ring-0 transition-all font-bold uppercase tracking-wide ${fulfillmentType === 'dine_in'
                                ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                                : 'border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.08]'
                                }`}
                        >
                            {t('digital_menu.checkout.fulfillment_options.dine_in')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFulfillmentType('pickup')}
                            className={`min-h-[44px] h-auto flex flex-col items-center justify-center rounded-2xl border px-1 py-1.5 text-[10px] leading-[1.15] text-center outline-none focus:outline-none focus:ring-0 transition-all font-bold uppercase tracking-wide ${fulfillmentType === 'pickup'
                                ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                                : 'border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.08]'
                                }`}
                        >
                            {t('digital_menu.checkout.fulfillment_options.pickup')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFulfillmentType('delivery')}
                            className={`min-h-[44px] h-auto flex flex-col items-center justify-center rounded-2xl border px-1 py-1.5 text-[10px] leading-[1.15] text-center outline-none focus:outline-none focus:ring-0 transition-all font-bold uppercase tracking-wide ${fulfillmentType === 'delivery'
                                ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                                : 'border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.08]'
                                }`}
                        >
                            {t('digital_menu.checkout.fulfillment_options.delivery')}
                        </button>
                    </div>

                    {fulfillmentType === 'delivery' ? (
                        <>
                            <AddressSelector
                                onSelectAddress={(addressInfo) => {
                                    if (addressInfo.neighborhoodId) updateField('neighborhoodId', addressInfo.neighborhoodId);
                                    if (addressInfo.addressText) updateField('deliveryAddress', addressInfo.addressText);
                                }}
                            />

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="neighborhoodId">
                                    {t('digital_menu.checkout.neighborhood')}
                                </label>
                                <NeighborhoodSearchSelect
                                    neighborhoods={neighborhoods || []}
                                    selectedId={formValues.neighborhoodId}
                                    onChangeSelectedId={(val) => updateField('neighborhoodId', val)}
                                    customName={formValues.customNeighborhood}
                                    onChangeCustomName={(val) => updateField('customNeighborhood', val)}
                                    t={t}
                                    fieldClassName={fieldClassName}
                                    error={Boolean(fieldErrors.neighborhoodId) || Boolean(fieldErrors.customNeighborhood)}
                                />
                                <FieldError message={fieldErrors.neighborhoodId} />
                                <FieldError message={fieldErrors.customNeighborhood} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="deliveryAddress">
                                    {t('digital_menu.checkout.delivery_address')}
                                </label>
                                <input
                                    id="deliveryAddress"
                                    type="text"
                                    value={formValues.deliveryAddress}
                                    onChange={(event) => updateField('deliveryAddress', event.target.value)}
                                    placeholder={t('digital_menu.checkout.placeholders.delivery_address')}
                                    autoComplete="street-address"
                                    aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                                    className={fieldClassName}
                                />
                                <FieldError message={fieldErrors.deliveryAddress} />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="deliveryComplement">
                                    {t('digital_menu.checkout.delivery_complement')}
                                </label>
                                <input
                                    id="deliveryComplement"
                                    type="text"
                                    value={formValues.deliveryComplement}
                                    onChange={(event) => updateField('deliveryComplement', event.target.value)}
                                    placeholder={t('digital_menu.checkout.placeholders.delivery_complement')}
                                    autoComplete="address-line2"
                                    className={fieldClassName}
                                />
                            </div>
                        </>
                    ) : null}

                    {fulfillmentType === 'dine_in' ? (
                        <>
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-text-muted">
                                {t('digital_menu.checkout.table_qr.scan_cta')}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="tableCode">
                                    {t('digital_menu.checkout.table_qr.manual_code')}
                                </label>
                                <input
                                    id="tableCode"
                                    type="text"
                                    value={formValues.tableCode}
                                    onChange={(event) => {
                                        const nextCode = event.target.value;
                                        updateField('tableCode', nextCode);

                                        const matchedTable = tableMapByName.get(String(nextCode).trim().toLowerCase());
                                        updateField('tableId', matchedTable?.id || '');
                                    }}
                                    placeholder={t('digital_menu.checkout.placeholders.table_code')}
                                    aria-invalid={Boolean(fieldErrors.tableCode)}
                                    className={fieldClassName}
                                />
                                <FieldError message={fieldErrors.tableCode} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={startQrScanner}
                                    className="h-10 rounded-full border border-white/10 bg-white/[0.02] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.08]"
                                >
                                    {t('digital_menu.checkout.table_qr.scan_button')}
                                </button>

                                {isScanningQr ? (
                                    <button
                                        type="button"
                                        onClick={stopQrScanner}
                                        className="h-10 rounded-full border border-white/10 bg-white/[0.02] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.08]"
                                    >
                                        {t('digital_menu.checkout.table_qr.stop_scan_button')}
                                    </button>
                                ) : null}
                            </div>

                            {isScanningQr ? (
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                                    <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline autoPlay />
                                </div>
                            ) : null}

                            {qrFeedbackKey ? (
                                <p className="text-xs text-emerald-300" role="status" aria-live="polite">{t(qrFeedbackKey)}</p>
                            ) : null}

                            {qrErrorKey ? (
                                <p className="text-xs text-red-300" role="alert">{t(qrErrorKey)}</p>
                            ) : null}

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-text-muted" htmlFor="tableId">
                                    {t('digital_menu.checkout.table_qr.table_list')}
                                </label>
                                <select
                                    id="tableId"
                                    value={formValues.tableId}
                                    onChange={(event) => {
                                        const nextTableId = event.target.value;
                                        updateField('tableId', nextTableId);
                                        const selectedTable = (tables || []).find((table) => table.id === nextTableId);
                                        if (selectedTable) {
                                            updateField('tableCode', selectedTable.name);
                                        }
                                    }}
                                    disabled={isCatalogLoading || catalogLoadFailed}
                                    className={fieldClassName}
                                >
                                    <option value="">{t('digital_menu.checkout.placeholders.table_list')}</option>
                                    {(tables || []).map((table) => (
                                        <option key={table.id} value={table.id}>
                                            {table.name} - {table.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                        {t('digital_menu.checkout.payment_section_title')}
                    </h3>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {activePaymentOptions.map((option) => {
                            const isActive = formValues.paymentMethod === option.key;
                            const isDisabled = !option.enabled;

                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (option.enabled) {
                                            updateField('paymentMethod', option.key);
                                        }
                                    }}
                                    className={`rounded-2xl border p-3 text-left transition-all ${isActive
                                        ? 'border-primary/40 bg-primary/15 shadow-[0_0_18px_rgba(139,92,246,0.28)]'
                                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.08]'
                                        } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                                            {option.icon}
                                        </span>
                                        <span className="text-sm font-semibold text-white">
                                            {t(`digital_menu.checkout.payment_options.${option.key}`)}
                                        </span>
                                    </div>
                                    {isDisabled ? (
                                        <p className="mt-1 text-[11px] text-text-muted">
                                            {t('digital_menu.checkout.payment_options.cash_unavailable')}
                                        </p>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                    <FieldError message={fieldErrors.paymentMethod} />
                </div>

                {formValues.paymentMethod === 'credit_card' && (
                    <CreditCardForm
                        amount={totalAmount}
                        payerEmail={formValues.payerEmail || ''}
                        onTokenReceived={handleCreditCardToken}
                        onTokenError={handleCreditCardError}
                    />
                )}
            </div>
        </section >
    );
}
