import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import CustomNumberInput from '@/Components/CustomNumberInput';
import useI18n from '@/hooks/useI18n';

const PIX_DEFAULT_TTL_SECONDS = 900;

export default function PaymentModal({ isOpen, onClose, onConfirm, total }) {
    const { t } = useI18n();

    const paymentMethods = useMemo(() => [
        {
            method: 'credito',
            icon: 'credit_card',
            label: t('pos.payment.methods.credito'),
            shortLabel: t('pos.payment.methods.credito_short'),
        },
        {
            method: 'debito',
            icon: 'credit_card',
            label: t('pos.payment.methods.debito'),
            shortLabel: t('pos.payment.methods.debito_short'),
        },
        {
            method: 'dinheiro',
            icon: 'payments',
            label: t('pos.payment.methods.dinheiro'),
            shortLabel: t('pos.payment.methods.dinheiro_short'),
        },
        {
            method: 'pix_balcao',
            icon: 'qr_code_scanner',
            label: t('pos.payment.methods.pix_balcao'),
            shortLabel: t('pos.payment.methods.pix_balcao_short'),
        },
        {
            method: 'pix',
            icon: 'qr_code_2',
            label: t('pos.payment.methods.pix'),
            shortLabel: t('pos.payment.methods.pix_short'),
        },
    ], [t]);

    const [payments, setPayments] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    // Online PIX (Mercado Pago) state
    const [generatingPix, setGeneratingPix] = useState(false);
    const [pixQrCode, setPixQrCode] = useState(null);
    const [pixQrCodeBase64, setPixQrCodeBase64] = useState(null);
    const [pixGatewayPaymentId, setPixGatewayPaymentId] = useState(null);
    const [pixAmount, setPixAmount] = useState(0);
    const [pixCountdown, setPixCountdown] = useState(PIX_DEFAULT_TTL_SECONDS);
    const [pixApproved, setPixApproved] = useState(false);
    const [pixError, setPixError] = useState(null);
    const [copied, setCopied] = useState(false);

    const pollingIntervalRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const approvalTimeoutRef = useRef(null);
    const pixApprovalHandledRef = useRef(false);

    // Customer fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isReturning, setIsReturning] = useState(false);
    const [nameLocked, setNameLocked] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingName, setSearchingName] = useState(false);
    const [searchingPhone, setSearchingPhone] = useState(false);
    const nameDebounceRef = useRef(null);
    const phoneDebounceRef = useRef(null);
    const nameInputRef = useRef(null);
    const dropdownRef = useRef(null);

    const clearPixTimers = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (approvalTimeoutRef.current) {
            clearTimeout(approvalTimeoutRef.current);
            approvalTimeoutRef.current = null;
        }
    }, []);

    const stopPixTracking = useCallback(() => {
        clearPixTimers();
        pixApprovalHandledRef.current = false;
        setGeneratingPix(false);
        setPixQrCode(null);
        setPixQrCodeBase64(null);
        setPixGatewayPaymentId(null);
        setPixAmount(0);
        setPixCountdown(PIX_DEFAULT_TTL_SECONDS);
        setPixApproved(false);
        setPixError(null);
        setCopied(false);
    }, [clearPixTimers]);

    // Clean up all timers on unmount
    useEffect(() => {
        return () => {
            clearPixTimers();
            if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
            if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
        };
    }, [clearPixTimers]);

    // Reset state when modal opens or closes
    useEffect(() => {
        if (isOpen) {
            stopPixTracking();
            setPayments([]);
            setSelectedMethod(null);
            setInputValue('');
            setCustomerName('');
            setCustomerPhone('');
            setIsReturning(false);
            setNameLocked(false);
            setSuggestions([]);
            setShowSuggestions(false);
            setSearchingName(false);
            setSearchingPhone(false);
            setTimeout(() => nameInputRef.current?.focus(), 100);
        } else {
            stopPixTracking();
        }
    }, [isOpen, stopPixTracking]);

    // Click outside dropdown to close
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                nameInputRef.current && !nameInputRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-focus the input when a method is selected
    useEffect(() => {
        if (selectedMethod && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [selectedMethod]);

    if (!isOpen) return null;

    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    const formatCountdown = (seconds) => {
        const safeSeconds = Math.max(0, seconds);
        const mins = Math.floor(safeSeconds / 60);
        const secs = safeSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Phone mask: (99) 99999-9999
    const formatPhone = (value) => {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
        if (digits.length === 0) return '';
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    // ── Name field change: search by name ──
    const handleNameChange = (e) => {
        const val = e.target.value;
        setCustomerName(val);

        if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);

        if (val.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSearchingName(true);
        nameDebounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get('/api/customers/search', { params: { query: val.trim() } });
                setSuggestions(res.data.customers || []);
                setShowSuggestions((res.data.customers || []).length > 0);
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
            setSearchingName(false);
        }, 350);
    };

    // ── Select a customer from the dropdown ──
    const selectCustomer = (c) => {
        setCustomerName(c.name);
        setCustomerPhone(c.phone ? formatPhone(c.phone) : '');
        setIsReturning(true);
        setNameLocked(true);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // ── Phone field change: search by phone ──
    const handlePhoneChange = (e) => {
        const raw = e.target.value;
        const formatted = formatPhone(raw);
        setCustomerPhone(formatted);

        if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 11) {
            setSearchingPhone(true);
            phoneDebounceRef.current = setTimeout(async () => {
                try {
                    const res = await axios.get('/api/customers/search', { params: { query: digits } });
                    if (res.data.found && res.data.customers?.length > 0) {
                        const c = res.data.customers[0];
                        setCustomerName(c.name);
                        setIsReturning(true);
                        setNameLocked(true);
                    } else {
                        setIsReturning(false);
                        setNameLocked(false);
                    }
                } catch {
                    setIsReturning(false);
                    setNameLocked(false);
                }
                setSearchingPhone(false);
            }, 400);
        } else {
            setIsReturning(false);
            setNameLocked(false);
        }
    };

    // ── Clear customer selection ──
    const clearCustomer = () => {
        setCustomerName('');
        setCustomerPhone('');
        setIsReturning(false);
        setNameLocked(false);
        setSuggestions([]);
        setShowSuggestions(false);
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, total - totalPaid);
    const change = Math.max(0, totalPaid - total);
    const isPixViewActive = Boolean(generatingPix || pixQrCode || pixError || pixApproved);
    const canFinalize = !isPixViewActive && totalPaid >= total && payments.length > 0 && customerName.trim().length > 0;

    const getMethodMeta = (method) => paymentMethods.find(m => m.method === method);

    const startPosPixPayment = async (rawAmount) => {
        const amount = Number(rawAmount);
        if (isNaN(amount) || amount <= 0) return;

        stopPixTracking();
        setGeneratingPix(true);
        setPixAmount(amount);
        setPixError(null);

        try {
            const response = await axios.post('/pos/generate-pix', {
                amount,
                customer_name: customerName.trim() || null,
            });

            const data = response.data || {};
            const gatewayId = String(data.gateway_payment_id || '');

            if (!gatewayId || !data.qr_code) {
                throw new Error(data.error || t('pos.payment.pix_modal.error'));
            }

            setGeneratingPix(false);
            setPixGatewayPaymentId(gatewayId);
            setPixQrCode(data.qr_code);
            setPixQrCodeBase64(data.qr_code_base64 || null);

            let ttl = PIX_DEFAULT_TTL_SECONDS;
            if (data.expires_at) {
                const diffSeconds = Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000);
                if (Number.isFinite(diffSeconds) && diffSeconds > 0) {
                    ttl = diffSeconds;
                }
            }
            setPixCountdown(ttl);

            countdownIntervalRef.current = setInterval(() => {
                setPixCountdown(prev => {
                    if (prev <= 1) {
                        clearPixTimers();
                        setPixError(t('pos.payment.pix_modal.expired'));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            pollingIntervalRef.current = setInterval(async () => {
                if (pixApprovalHandledRef.current) return;
                try {
                    const statusRes = await axios.get(`/pos/pix-status/${encodeURIComponent(gatewayId)}`);
                    if (statusRes.data?.status === 'approved' && !pixApprovalHandledRef.current) {
                        pixApprovalHandledRef.current = true;
                        clearPixTimers();
                        setPixApproved(true);
                        setPayments(prev => [
                            ...prev,
                            {
                                id: Date.now(),
                                method: 'pix',
                                label: t('pos.payment.methods.pix'),
                                amount,
                                gateway_id: gatewayId,
                            },
                        ]);
                        setSelectedMethod(null);
                        setInputValue('');
                        approvalTimeoutRef.current = setTimeout(() => {
                            stopPixTracking();
                        }, 1200);
                    }
                } catch {
                    // Ignore transient network errors during polling
                }
            }, 3000);
        } catch (err) {
            setGeneratingPix(false);
            setPixError(err?.response?.data?.error || err?.message || t('pos.payment.pix_modal.error'));
        }
    };

    const handleCopyPixCode = () => {
        if (!pixQrCode) return;
        navigator.clipboard?.writeText(pixQrCode).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectMethod = (method) => {
        setSelectedMethod(method);
        // Default to remaining amount
        setInputValue(remaining > 0 ? remaining.toFixed(2) : '');
    };

    const addPayment = () => {
        if (!selectedMethod) return;
        const amount = parseFloat(inputValue);
        if (isNaN(amount) || amount <= 0) return;

        if (selectedMethod === 'pix') {
            startPosPixPayment(amount);
            return;
        }

        setPayments(prev => [...prev, {
            id: Date.now(),
            method: selectedMethod,
            label: getMethodMeta(selectedMethod)?.label || selectedMethod,
            amount,
        }]);

        setSelectedMethod(null);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPayment();
        }
    };

    const removePayment = (id) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const quickFullPayment = (method) => {
        if (method === 'pix') {
            const amountToCharge = remaining > 0 ? remaining : total;
            startPosPixPayment(amountToCharge);
            return;
        }

        const label = getMethodMeta(method)?.label || method;
        setPayments([{ id: Date.now(), method, label, amount: total }]);
        setSelectedMethod(null);
        setInputValue('');
    };

    const handleCloseModal = () => {
        stopPixTracking();
        onClose();
    };

    const handleConfirm = () => {
        if (!canFinalize) return;
        const rawDigits = customerPhone.replace(/\D/g, '');
        onConfirm(
            payments.map(({ method, amount, gateway_id }) => ({
                method,
                amount,
                ...(gateway_id ? { gateway_id } : {}),
            })),
            customerName.trim(),
            rawDigits.length >= 10 ? rawDigits : null
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-sm" onClick={handleCloseModal}>
            <div
                className="bg-[#14141A] w-full max-w-2xl rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">point_of_sale</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{t('pos.payment.title')}</h3>
                            <p className="text-xs text-text-muted">{t('pos.payment.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={handleCloseModal} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-5 flex-1">
                    {isPixViewActive ? (
                        <div className="flex flex-col items-center text-center space-y-4 py-2" data-testid="pos-pix-qr-view">
                            <div>
                                <h4 className="text-lg font-black text-white flex items-center justify-center gap-2">
                                    <span className={`material-symbols-outlined text-xl ${pixApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {pixApproved ? 'check_circle' : 'qr_code_2'}
                                    </span>
                                    {t('pos.payment.pix_modal.title')}
                                </h4>
                                <p className="text-xs text-text-muted mt-1">
                                    {t('pos.payment.pix_modal.subtitle')}
                                </p>
                            </div>

                            <div className="w-full max-w-sm rounded-2xl bg-black/40 border border-border-subtle p-5 flex flex-col items-center space-y-4">
                                {generatingPix ? (
                                    <div className="w-48 h-48 flex flex-col items-center justify-center space-y-3">
                                        <div className="size-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                                            {t('pos.payment.pix_modal.generating')}
                                        </span>
                                    </div>
                                ) : pixError ? (
                                    <div className="w-full py-6 flex flex-col items-center justify-center space-y-2">
                                        <span className="material-symbols-outlined text-red-400 text-4xl">error</span>
                                        <p className="text-xs text-red-400 font-semibold leading-relaxed">
                                            {pixError}
                                        </p>
                                    </div>
                                ) : pixApproved ? (
                                    <div className="w-48 h-48 flex flex-col items-center justify-center space-y-3">
                                        <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-400 text-3xl">check</span>
                                        </div>
                                        <span className="text-sm text-emerald-400 font-black uppercase tracking-wider">
                                            {t('pos.payment.pix_modal.approved')}
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {pixQrCodeBase64 && (
                                            <div className="bg-white p-3 rounded-xl shadow-lg">
                                                <img
                                                    src={`data:image/png;base64,${pixQrCodeBase64}`}
                                                    alt={t('pos.payment.pix_modal.title')}
                                                    className="w-48 h-48 object-contain"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-base font-black text-white font-mono">
                                                {t('pos.payment.pix_modal.amount').replace(':amount', formatBRL(pixAmount))}
                                            </p>
                                            <p className="text-xs font-bold text-amber-400">
                                                {t('pos.payment.pix_modal.countdown').replace(':time', formatCountdown(pixCountdown))}
                                            </p>
                                        </div>
                                        {pixQrCode && (
                                            <button
                                                type="button"
                                                onClick={handleCopyPixCode}
                                                className={`w-full py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${copied
                                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                                    : 'bg-surface border-border-subtle text-white hover:bg-surface-hover'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-base">
                                                    {copied ? 'check' : 'content_copy'}
                                                </span>
                                                {copied ? t('pos.payment.pix_modal.copied') : t('pos.payment.pix_modal.copy_code')}
                                            </button>
                                        )}
                                        <div className="w-full flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 py-2.5 px-4 rounded-xl">
                                            <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                                            <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                                                {t('pos.payment.pix_modal.waiting')}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {!pixApproved && (
                                <button
                                    type="button"
                                    onClick={stopPixTracking}
                                    className="px-6 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border-subtle text-text-muted hover:text-white text-xs font-bold transition-all"
                                >
                                    {t('pos.payment.pix_modal.cancel')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── Customer Section ── */}
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    {t('pos.payment.customer_section')}
                                </p>
                                <div className="space-y-3">
                                    {/* Customer Name + Autocomplete Dropdown */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            value={customerName}
                                            onChange={handleNameChange}
                                            readOnly={nameLocked}
                                            placeholder={t('pos.payment.customer_name_placeholder')}
                                            className={`w-full bg-surface border rounded-xl pl-10 pr-24 py-3 text-white text-sm font-medium placeholder:text-text-muted/50 focus:border-primary/50 outline-none transition-all ${nameLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border-subtle'
                                                }`}
                                        />
                                        {searchingName && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                                                <span className="material-symbols-outlined text-[18px]">progress_activity</span>
                                            </span>
                                        )}
                                        {isReturning && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                                    {t('pos.payment.returning_badge')}
                                                </span>
                                                <button onClick={clearCustomer} className="text-text-muted hover:text-red-400 transition-colors" title={t('pos.payment.clear_customer')}>
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Dropdown Suggestions */}
                                        {showSuggestions && (
                                            <div
                                                ref={dropdownRef}
                                                className="absolute left-0 right-0 top-full mt-1 bg-[#1A1A24] border border-border-subtle rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden max-h-60 overflow-y-auto"
                                            >
                                                {suggestions.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => selectCustomer(c)}
                                                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors flex items-center justify-between group border-b border-border-subtle/50 last:border-0"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                                <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.name}</p>
                                                                <p className="text-text-muted text-xs">
                                                                    {c.phone ? formatPhone(c.phone) : t('pos.payment.no_phone')}
                                                                    {c.orders_count > 0 && (
                                                                        <span className="text-emerald-400 ml-2">
                                                                            • {c.orders_count} {c.orders_count > 1 ? t('pos.payment.order_plural') : t('pos.payment.order_singular')}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="material-symbols-outlined text-text-muted text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Customer Phone */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">call</span>
                                        <input
                                            type="text"
                                            value={customerPhone}
                                            onChange={handlePhoneChange}
                                            readOnly={nameLocked}
                                            placeholder={t('pos.payment.phone_placeholder')}
                                            className={`w-full bg-surface border rounded-xl pl-10 pr-10 py-3 text-white text-sm font-medium placeholder:text-text-muted/50 focus:border-primary/50 outline-none transition-all ${nameLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border-subtle'
                                                }`}
                                        />
                                        {searchingPhone && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                                                <span className="material-symbols-outlined text-[18px]">progress_activity</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Total do Pedido */}
                            <div className="bg-black/40 border border-border-subtle rounded-xl p-4 flex justify-between items-center">
                                <span className="text-text-muted text-sm font-bold uppercase tracking-wider">{t('pos.payment.order_total')}</span>
                                <span className="text-2xl font-black text-white font-mono">{formatBRL(total)}</span>
                            </div>

                            {/* Quick Payment Buttons */}
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">{t('pos.payment.quick_payment')}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {paymentMethods.map(pm => (
                                        <button
                                            key={pm.method}
                                            type="button"
                                            data-testid={`pos-quick-${pm.method}`}
                                            onClick={() => quickFullPayment(pm.method)}
                                            className={`py-3 px-2 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 bg-surface hover:bg-surface-hover text-white border transition-all ${pm.method === 'pix'
                                                ? 'border-amber-500/30 hover:border-amber-400/60'
                                                : pm.method === 'pix_balcao'
                                                    ? 'border-emerald-500/30 hover:border-emerald-400/60'
                                                    : 'border-transparent hover:border-primary/30'
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined text-[22px] ${pm.method === 'pix'
                                                ? 'text-amber-400'
                                                : pm.method === 'pix_balcao'
                                                    ? 'text-emerald-400'
                                                    : ''
                                                }`}>{pm.icon}</span>
                                            <span className="leading-tight text-center">{pm.shortLabel}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Split Payment Section */}
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">{t('pos.payment.split_payment')}</p>

                                {/* Method Selection Row */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                                    {paymentMethods.map(pm => (
                                        <button
                                            key={pm.method}
                                            type="button"
                                            data-testid={`pos-split-${pm.method}`}
                                            onClick={() => selectMethod(pm.method)}
                                            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${selectedMethod === pm.method
                                                ? 'bg-primary/20 text-primary border border-primary/40 shadow-lg shadow-primary/10'
                                                : 'bg-surface hover:bg-surface-hover text-text-muted border border-transparent'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                                            <span className="leading-tight text-center">{pm.shortLabel}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Amount Input — visible when a method is selected  */}
                                {selectedMethod && (
                                    <div className="flex gap-2 animate-in fade-in">
                                        <CustomNumberInput
                                            ref={inputRef}
                                            value={inputValue}
                                            onChange={val => setInputValue(val)}
                                            onKeyDown={handleKeyDown}
                                            prefix="R$"
                                            step={0.01}
                                            min={0.01}
                                            placeholder="0,00"
                                            className="w-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={addPayment}
                                            disabled={!inputValue || parseFloat(inputValue) <= 0}
                                            className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {selectedMethod === 'pix' ? 'qr_code_2' : 'add'}
                                            </span>
                                            {selectedMethod === 'pix' ? t('pos.payment.generate_pix_qr') : t('pos.payment.add')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Added Payments List */}
                            {payments.length > 0 && (
                                <div>
                                    <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">{t('pos.payment.added_payments')}</p>
                                    <div className="space-y-2">
                                        {payments.map(p => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border-subtle group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">
                                                        {getMethodMeta(p.method)?.icon || 'payments'}
                                                    </span>
                                                    <span className="text-white font-semibold text-sm">{p.label}</span>
                                                    {p.gateway_id && (
                                                        <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                                                            {t('pos.payment.pix_approved_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-emerald-400 font-mono font-bold">{formatBRL(p.amount)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePayment(p.id)}
                                                        className="text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer — Summary + Confirm */}
                <div className="p-5 border-t border-border-subtle bg-[#111118] space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                            <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">{t('pos.payment.remaining_amount')}</span>
                            <span className={`text-xl font-black font-mono ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {formatBRL(remaining)}
                            </span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                            <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">{t('pos.payment.change')}</span>
                            <span className={`text-xl font-black font-mono ${change > 0 ? 'text-primary' : 'text-text-muted'}`}>
                                {formatBRL(change)}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canFinalize}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canFinalize
                            ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25'
                            : 'bg-surface text-text-muted cursor-not-allowed border border-border-subtle'
                            }`}
                    >
                        {canFinalize ? (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                {t('pos.payment.finalize_sale')}
                            </>
                        ) : customerName.trim().length === 0 ? (
                            <>
                                <span className="material-symbols-outlined">person_off</span>
                                {t('pos.payment.enter_customer_name')}
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">lock</span>
                                {t('pos.payment.enter_remaining_amount')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
