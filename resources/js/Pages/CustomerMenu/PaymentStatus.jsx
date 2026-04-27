import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState, useRef, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';
import { usePaymentStatusPolling } from './hooks/usePaymentStatusPolling';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';

/* ─── Configurações ─── */
const TYPE_CONFIG = {
    pickup: { label: 'Retirada no Balcão', icon: '🏪' },
    delivery: { label: 'Delivery', icon: '🛵' },
    salon: { label: 'Mesa (Salão)', icon: '🍽️' },
    dine_in: { label: 'Mesa (Salão)', icon: '🍽️' },
};

const getStatusConfig = (t, isOnlinePaid = false) => ({
    pending: { 
        label: isOnlinePaid ? `✅ Pagamento Aprovado! ${t('digital_menu.payment.labels.pending')}` : t('digital_menu.payment.labels.pending'), 
        icon: isOnlinePaid ? '✅' : '📋', 
        color: isOnlinePaid ? 'text-emerald-400' : 'text-amber-400', 
        bg: isOnlinePaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20' 
    },
    awaiting_payment: { label: t('digital_menu.payment.labels.awaiting_payment'), icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10  border-amber-500/20' },
    accepted: { label: t('digital_menu.payment.labels.accepted'), icon: '👩‍🍳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    paid_online: { label: t('digital_menu.payment.labels.paid_online'), icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    paid: { label: t('digital_menu.payment.labels.paid_online'), icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    preparing: { label: t('digital_menu.payment.labels.preparing'), icon: '🍕', color: 'text-blue-400', bg: 'bg-blue-500/10   border-blue-500/20' },
    ready: { label: t('digital_menu.payment.labels.ready'), icon: '🔔', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    delivered: { label: t('digital_menu.payment.labels.delivered'), icon: '🎉', color: 'text-white', bg: 'bg-white/5       border-white/10' },
    completed: { label: t('digital_menu.payment.labels.delivered'), icon: '⭐', color: 'text-white', bg: 'bg-white/5       border-white/10' },
    rejected: { label: t('digital_menu.payment.labels.rejected'), icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/20' },
    cancelled: { label: t('digital_menu.payment.labels.cancelled'), icon: '🚫', color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/20' },
});

/* ─── Stepper steps ─── */
const getSteps = (t) => [
    { key: 'received', label: t('digital_menu.payment.stepper.received'), icon: '📋' },
    { key: 'confirmed', label: t('digital_menu.payment.stepper.confirmed'), icon: '✅' },
    { key: 'preparing', label: t('digital_menu.payment.stepper.preparing'), icon: '🍕' },
    { key: 'ready', label: t('digital_menu.payment.stepper.ready'), icon: '🔔' },
    { key: 'delivered', label: t('digital_menu.payment.stepper.delivered'), icon: '🎉' },
];

function resolveStatusKey(status) {
    const s = String(status || '').toLowerCase();
    if (['paid', 'paid_online'].includes(s)) return 'paid_online';
    if (s === 'pending') return 'pending';
    if (s === 'accepted') return 'accepted';
    if (s === 'rejected') return 'rejected';
    if (s === 'preparing') return 'preparing';
    if (s === 'ready') return 'ready';
    if (['delivered', 'completed'].includes(s)) return 'delivered';
    if (s === 'cancelled') return 'cancelled';
    return 'awaiting_payment';
}

function resolveActiveStep(statusKey) {
    const map = {
        awaiting_payment: 0,
        paid_online: 1,
        pending: 1,
        accepted: 1,
        preparing: 2,
        ready: 3,
        delivered: 4,
    };
    return map[statusKey] ?? 0;
}

function OrderStepper({ activeStep, t }) {
    const steps = getSteps(t);
    return (
        <div className="w-full my-6">
            <div className="flex items-center justify-between relative">
                {/* progress line */}
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-white/10" />
                <div
                    className="absolute left-0 top-5 h-0.5 bg-emerald-500 transition-all duration-700"
                    style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((step, i) => {
                    const done = i < activeStep;
                    const active = i === activeStep;
                    return (
                        <div key={step.key} className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${done ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    active ? 'bg-white/10 border-emerald-400 text-white shadow-[0_0_16px_rgba(52,211,153,0.4)]' :
                                        'bg-[#0D0D12] border-white/10 text-white/20'
                                 }`}>
                                {done ? '✓' : step.icon}
                            </div>
                            <p className={`text-[9px] font-black uppercase tracking-widest text-center max-w-[60px] leading-tight ${active ? 'text-emerald-400' : done ? 'text-white/60' : 'text-white/20'
                                }`}>{step.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PixSection({ pixQrCode, pixQrCodeBase64 }) {
    const [copied, setCopied] = useState(false);
    const copyTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

    const handleCopy = async () => {
        if (!pixQrCode) return;
        try {
            await navigator.clipboard.writeText(pixQrCode);
            setCopied(true);
            
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch { /* noop */ }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 mt-4">
            <h2 className="font-bold text-white text-center">Escaneie o QR Code PIX</h2>
            {pixQrCodeBase64 && (
                <div className="bg-white p-4 rounded-2xl inline-flex flex-col items-center mx-auto w-full max-w-[220px]">
                    <img src={`data:image/png;base64,${pixQrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
            )}
            {pixQrCode && (
                <div className="space-y-2">
                    <p className="text-xs text-white/40 text-center">Ou copie o código (Pix Copia e Cola):</p>
                    <p className="break-all text-xs text-white/60 bg-black/40 rounded-xl p-3 font-mono">{pixQrCode}</p>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-colors"
                    >
                        {copied ? '✓ Copiado!' : 'Copiar Código PIX'}
                    </button>
                </div>
            )}
        </div>
    );
}

function TabStatus({ activeStep, statusKey, pixQrCode, pixQrCodeBase64, t }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-4">
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/60">local_shipping</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white/80">{t('digital_menu.payment.tracking_title')}</h2>
                        <p className="text-xs text-white/40">{t('digital_menu.payment.tracking_subtitle')}</p>
                    </div>
                </div>

                {statusKey !== 'cancelled' && statusKey !== 'rejected' ? (
                    <OrderStepper activeStep={activeStep} t={t} />
                ) : (
                    <div className="py-8 text-center text-white/40 font-bold uppercase tracking-widest text-sm">
                        {t('digital_menu.payment.tracking_unavailable')}
                    </div>
                )}

                {statusKey === 'awaiting_payment' && (pixQrCode || pixQrCodeBase64) && (
                    <PixSection pixQrCode={pixQrCode} pixQrCodeBase64={pixQrCodeBase64} />
                )}
            </div>

            <p className="text-center text-xs text-white/40 mt-6 px-4">
                {t('digital_menu.payment.auto_update_notice')}
            </p>
        </div>
    );
}

function TabOrder({ orderDetail, formatCurrency, t }) {
    const typeInfo = TYPE_CONFIG[orderDetail.type] ?? { label: orderDetail.type, icon: '📦' };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {/* Informações Principais */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.delivery_data_title')}</h3>

                <div className="space-y-4 px-1">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-white/40 text-[20px]">person</span>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.customer_label')}</p>
                            <p className="text-sm font-bold text-white leading-none">{orderDetail.customer_name}</p>
                            <p className="text-xs text-white/60 mt-1">{orderDetail.customer_phone}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-white/40 text-[20px]">{orderDetail.type === 'delivery' ? 'local_shipping' : 'storefront'}</span>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.mode_label')} ({typeInfo.label})</p>
                            <p className="text-sm font-bold text-white leading-snug">
                                {orderDetail.type === 'delivery'
                                    ? orderDetail.delivery_address
                                    : 'Retirar no local da filial'}
                            </p>
                            {orderDetail.type === 'delivery' && orderDetail.delivery_complement && (
                                <p className="text-xs text-white/60 mt-0.5">{orderDetail.delivery_complement}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Itens do Pedido */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.items_title', { count: orderDetail.items_count })}</h3>

                <div className="space-y-4">
                    {orderDetail.items.map(item => (
                        <div key={item.id} className="flex gap-3 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <span className="text-[11px] font-black bg-white/10 rounded px-2 py-1 text-white shrink-0">
                                {item.quantity}x
                            </span>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-bold text-white leading-snug break-words">
                                    {item.name}
                                </p>
                                {item.description && (
                                    <div className="mt-1 space-y-0.5">
                                        {item.description.split('|').map((c, idx) => (
                                            <p key={idx} className="text-xs text-amber-400/80">
                                                ✕ {c.trim()}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <p className="text-xs text-amber-400/80 mt-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                                        {t('digital_menu.payment.observation_label')}: {item.notes}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-white/80 shrink-0 tabular-nums">
                                {formatCurrency(item.subtotal)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {orderDetail.notes && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-3">
                    <span className="material-symbols-outlined text-white/40">speaker_notes</span>
                    <p className="text-sm text-white/80">{orderDetail.notes}</p>
                </div>
            )}
        </div>
    );
}

function TabPayment({ statusKey, paymentData, orderDetail, formatCurrency, t }) {
    const isCashPayment = !paymentData?.paymentMethodOnline && !orderDetail.payment_method_online;
    const isApproved = ['paid_online', 'accepted', 'preparing', 'ready', 'delivered', 'completed', 'paid', 'pending'].includes(statusKey);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">

            {/* Status e Método */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.payment_title')}</h3>

                <div className="space-y-5 px-1">
                    <div className="flex gap-3 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            <span className="material-symbols-outlined">{isApproved ? 'check_circle' : 'hourglass_empty'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.payment_status_label')}</p>
                            <p className={`text-sm font-bold leading-none ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isApproved ? t('digital_menu.payment.payment_status_approved') : t('digital_menu.payment.payment_status_pending')}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white/60 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined">{isCashPayment ? 'payments' : 'credit_card'}</span>
                        </div>
                        <div>
                            <p className="text-xs text-white/40 leading-none mb-1">{t('digital_menu.payment.payment_method_label')}</p>
                            <p className="text-sm font-bold text-white leading-tight break-words whitespace-normal">
                                {isCashPayment ? t('digital_menu.payment.payment_method_direct') : t('digital_menu.payment.payment_method_online')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejeição */}
            {statusKey === 'rejected' && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
                    <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="material-symbols-outlined text-2xl">error</span>
                    </div>
                    <p className="text-base font-bold text-red-400 mb-1">{t('digital_menu.payment.payment_rejected_title')}</p>
                    <p className="text-sm text-white/60 mb-4">{t('digital_menu.payment.payment_rejected_desc')}</p>
                    <Link href="/menu/checkout" className="block w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide transition-colors">
                        {t('digital_menu.payment.retry_payment')}
                    </Link>
                </div>
            )}

            {/* Info de Dinheiro */}
            {isCashPayment && statusKey !== 'delivered' && statusKey !== 'completed' && statusKey !== 'cancelled' && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
                    <p className="text-base font-bold text-amber-400 mb-1">💵 {t('digital_menu.payment.cash_on_delivery_title', { type: orderDetail.type === 'delivery' ? 'entrega' : 'retirada' })}</p>
                    <p className="text-sm text-white/60">{t('digital_menu.payment.cash_on_delivery_desc')}</p>
                </div>
            )}

            {/* Resumo de Valores */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 px-1">{t('digital_menu.payment.financial_summary_title')}</h3>

                <div className="space-y-2.5 px-1 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">{t('digital_menu.payment.subtotal_label')}</span>
                        <span className="text-white">{formatCurrency(orderDetail.total_amount - orderDetail.delivery_fee)}</span>
                    </div>
                    {orderDetail.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">{t('digital_menu.payment.delivery_fee_label')}</span>
                            <span className="text-white">{formatCurrency(orderDetail.delivery_fee)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 pt-4 px-1 flex justify-between items-center">
                    <span className="font-bold text-white">{t('digital_menu.payment.grand_total_label')}</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(orderDetail.total_amount)}</span>
                </div>
            </div>

        </div>
    );
}

export default function PaymentStatus() {
    const { t, formatCurrency } = useI18n();
    const { orderId, orderDetail } = usePage().props;
    const { status, paymentData, isLoading, error } = usePaymentStatusPolling(orderId);

    const [activeTab, setActiveTab] = useState('status'); // 'status', 'order', 'payment'

    const statusKey = useMemo(() => resolveStatusKey(status), [status]);
    const activeStep = useMemo(() => resolveActiveStep(statusKey), [statusKey]);
    const statusCfg = useMemo(() => {
        const isOnlinePaid = paymentData?.paymentMethodOnline || orderDetail.payment_method_online;
        const config = getStatusConfig(t, isOnlinePaid);
        return config[statusKey] ?? config.awaiting_payment;
    }, [statusKey, t, paymentData, orderDetail]);

    const pixQrCode = paymentData?.pixQrCode ?? orderDetail.pix_qr_code ?? null;
    const pixQrCodeBase64 = paymentData?.pixQrCodeBase64 ?? orderDetail.pix_qr_code_base64 ?? null;

    // Fallback pra exibição: code do polling > code initial > fallback slice id
    const displayCode = paymentData?.orderCode
        ? `#${paymentData.orderCode}`
        : (orderDetail?.short_code ? `#${orderDetail.short_code}` : `#${String(orderId).slice(0, 5).toUpperCase()}`);

    return (
        <main className="min-h-screen bg-[#0D0D12] text-white flex flex-col">

            {/* Header / Nav */}
            <header className={`${luccheseMenuTheme.glass} sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5`}>
                <div className="flex items-center gap-4">
                    <Link href="/menu/orders" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tight">Detalhes do Pedido</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-primary tracking-widest">{displayCode}</p>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <p className="text-xs text-white/40">{orderDetail.created_at_formatted}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 w-full max-w-lg mx-auto p-4 pb-24">

                {/* Status Hero Card */}
                <div className={`rounded-3xl border p-6 text-center shadow-lg mb-6 ${statusCfg.bg}`}>
                    <div className="text-4xl mb-3">{statusCfg.icon}</div>
                    <h1 className={`text-[22px] font-black leading-tight ${statusCfg.color}`}>{statusCfg.label}</h1>

                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-emerald-400 animate-spin" />
                            <span className="text-xs text-white/50 font-medium">Buscando atualizações de status...</span>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-300 mt-3 font-medium bg-red-900/20 py-2 px-3 rounded-lg inline-block">Erro de conexão. Tente recarregar a página.</p>}
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-white/5 rounded-2xl mb-6 border border-white/5">
                    {[
                        { id: 'status', icon: 'location_on', label: 'Status' },
                        { id: 'order', icon: 'receipt_long', label: 'O Pedido' },
                        { id: 'payment', icon: 'payments', label: 'Pagamento' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white/10 text-white shadow-sm border border-white/5'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px] mb-0.5">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[300px]">
                    {activeTab === 'status' && (
                        <TabStatus
                            activeStep={activeStep}
                            statusKey={statusKey}
                            pixQrCode={pixQrCode}
                            pixQrCodeBase64={pixQrCodeBase64}
                            t={t}
                        />
                    )}

                    {activeTab === 'order' && (
                        <TabOrder
                            orderDetail={orderDetail}
                            formatCurrency={formatCurrency}
                            t={t}
                        />
                    )}

                    {activeTab === 'payment' && (
                        <TabPayment
                            statusKey={statusKey}
                            paymentData={paymentData}
                            orderDetail={orderDetail}
                            formatCurrency={formatCurrency}
                            t={t}
                        />
                    )}
                </div>

            </div>

        </main>
    );
}
