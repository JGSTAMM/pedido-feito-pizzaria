import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import useI18n from '@/hooks/useI18n';
import { usePaymentStatusPolling } from './hooks/usePaymentStatusPolling';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';
import { resolveStatusKey, resolveActiveStep, getStatusConfig } from './utils/orderStatusHelpers';

// Components
import TabStatus from './components/checkout/TabStatus';
import TabOrder from './components/checkout/TabOrder';
import TabPayment from './components/checkout/TabPayment';

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
