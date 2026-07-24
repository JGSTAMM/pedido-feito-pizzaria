import React, { useEffect } from 'react';
import CustomNumberInput from '@/Components/CustomNumberInput';
import { useCheckoutMath } from '../../hooks/useCheckoutMath';
import BillConference from './BillConference';
import ServiceFeeToggle from './ServiceFeeToggle';
import DiscountSection from './DiscountSection';
import CalculatorPopover from './CalculatorPopover';

export default function CheckoutModal({
    activeOrders,
    payments,
    setPayments,
    checkoutPaymentMethod,
    setCheckoutPaymentMethod,
    paymentInputValue,
    setPaymentInputValue,
    handleCheckout, // Needs to accept checkout payload
    checkingOut,
    onClose,
    generatePixPayment,
    formatCurrency,
    t,
    
    // PIX states
    generatingPix,
    pixQrCode,
    pixQrCodeBase64,
    pixAmount,
    pixCountdown,
    pixApproved,
    pixError,
    setIsQrFullscreen,
    handleCopyCode,
    copied,
    stopPixTracking,
    formatCountdown
}) {
    if (!activeOrders || activeOrders.length === 0) return null;

    const {
        serviceFeeEnabled,
        setServiceFeeEnabled,
        discountValue,
        discountMode,
        discountUnlocked,
        supervisorName,
        supervisorId,
        subtotal,
        serviceFeeAmount,
        discountAmount,
        grandTotal,
        resetDiscount,
        applyDiscount
    } = useCheckoutMath({ activeOrders });

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, grandTotal - totalPaid);
    const change = Math.max(0, totalPaid - grandTotal);

    const onFinish = () => {
        handleCheckout(payments, {
            service_fee_cents: Math.round(serviceFeeAmount * 100),
            discount_cents: Math.round(discountAmount * 100),
            discount_supervisor_id: supervisorId,
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div
                className="absolute inset-0 bg-[#0D0D12]/40 backdrop-blur-md animate-fade-in"
                onClick={() => !checkingOut && onClose()}
            />

            <div className="relative w-full max-w-lg max-h-[92dvh] bg-[#12121A]/95 sm:bg-[#12121A]/80 backdrop-blur-2xl border border-white/10 rounded-t-[32px] sm:rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-scale-in">

                {/* Header Section */}
                <div className="p-4 sm:p-8 pb-2 sm:pb-4 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">account_balance_wallet</span>
                            {t('floor.drawer.checkout.title')}
                        </h3>
                        <p className="text-text-muted text-[11px] sm:text-sm font-medium mt-0.5 sm:mt-1 leading-tight">{t('floor.drawer.checkout.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <CalculatorPopover />
                        <button
                            onClick={() => !checkingOut && onClose()}
                            className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Summary Dashboard - Fixed at top */}
                <div className="px-4 sm:px-8 py-2 sm:py-4 grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
                    <div className="col-span-2 bg-emerald-500/5 border border-emerald-500/20 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-4xl sm:text-6xl text-emerald-400">payments</span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] uppercase font-black text-emerald-400/60 tracking-[0.2em] mb-1">{t('floor.drawer.checkout.total_label')}</p>
                        <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter">
                            {formatCurrency(grandTotal)}
                        </p>
                    </div>

                    {/* Remaining Card */}
                    <div className={`p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] border transition-all ${remaining > 0.01
                            ? 'bg-orange-500/5 border-orange-500/20'
                            : 'bg-emerald-500/5 border-emerald-500/20'
                        }`}>
                        <p className="text-[8px] sm:text-[9px] uppercase font-bold text-text-muted tracking-widest mb-0.5 sm:mb-1">{t('floor.drawer.checkout.remaining_label')}</p>
                        <p className={`text-base sm:text-xl font-black tracking-tight ${remaining > 0.01
                                ? 'text-orange-400'
                                : 'text-emerald-400'
                            }`}>
                            {formatCurrency(remaining)}
                        </p>
                    </div>

                    {/* Change Card */}
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 sm:p-4 rounded-[16px] sm:rounded-[20px]">
                        <p className="text-[8px] sm:text-[9px] uppercase font-bold text-text-muted tracking-widest mb-0.5 sm:mb-1">{t('floor.drawer.checkout.change_label')}</p>
                        <p className="text-base sm:text-xl font-black text-blue-400 tracking-tight">
                            {formatCurrency(change)}
                        </p>
                    </div>
                </div>

                {generatingPix || pixQrCode || pixError || pixApproved ? (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                        {/* Scrollable Pix Content */}
                        <div className="px-4 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 min-h-0">
                            <div className="w-full text-center mx-auto shrink-0">
                                <h4 className="text-lg font-black text-white tracking-tight flex items-center justify-center gap-2">
                                    <span className={`material-symbols-outlined text-xl ${pixApproved ? 'text-emerald-400 animate-bounce' : 'text-amber-400 animate-pulse'}`}>
                                        {pixApproved ? 'check_circle' : 'qr_code_scanner'}
                                    </span>
                                    {t('floor.drawer.pix.title')}
                                </h4>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                    {t('floor.drawer.pix.scanHint')}
                                </p>
                            </div>

                            {/* Glassmorphic card for QR Code with smooth glows */}
                            <div className="relative p-4 sm:p-6 rounded-[28px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center space-y-4 group overflow-hidden max-w-[280px] w-full mx-auto shrink-0">
                                {/* Soft pulsing glow behind the QR code */}
                                <div className={`absolute inset-0 -z-10 opacity-30 blur-2xl transition-all duration-700 ${
                                    pixApproved 
                                        ? 'bg-emerald-500/20 group-hover:scale-110 animate-pulse' 
                                        : 'bg-amber-500/10 group-hover:scale-110'
                                }`} />

                                {generatingPix ? (
                                    <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center space-y-3">
                                        <div className="size-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest animate-pulse">
                                            {t('floor.drawer.pix.generating')}
                                        </span>
                                    </div>
                                ) : pixError ? (
                                    <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center text-center p-4">
                                        <span className="material-symbols-outlined text-red-400 text-4xl mb-2 animate-bounce">error</span>
                                        <span className="text-xs text-red-400 font-bold leading-normal">
                                            {pixError}
                                        </span>
                                    </div>
                                ) : pixApproved ? (
                                    <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center text-center">
                                        <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3 animate-scale-in">
                                            <span className="material-symbols-outlined text-emerald-400 text-3xl">check</span>
                                        </div>
                                        <span className="text-sm text-emerald-400 font-black uppercase tracking-wider">
                                            {t('floor.drawer.pix.approved')}
                                        </span>
                                    </div>
                                ) : pixQrCodeBase64 ? (
                                    <button
                                        onClick={() => setIsQrFullscreen(true)}
                                        className="w-full py-4 px-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 active:scale-95 group relative overflow-hidden flex flex-row items-center justify-between shrink-0"
                                    >
                                        <div className="absolute inset-0 bg-amber-500/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center relative z-10 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                            <span className="material-symbols-outlined text-amber-400 text-[22px]">qr_code_2</span>
                                        </div>
                                        <div className="flex flex-col items-start flex-1 min-w-0 mx-4 relative z-10 text-left">
                                            <span className="font-black text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 truncate w-full">
                                                {t('floor.drawer.pix.enlargeQr') || 'AMPLIAR QR CODE'}
                                            </span>
                                            <span className="text-[10px] text-amber-400/70 font-medium truncate w-full">
                                                {t('floor.drawer.pix.enlargeHint') || 'Toque para tela cheia'}
                                            </span>
                                        </div>
                                        <div className="relative z-10 shrink-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-amber-400/80 text-[24px] group-hover:translate-x-1 group-hover:text-amber-300 transition-all">fullscreen</span>
                                        </div>
                                    </button>
                                ) : null}

                                <div className="w-full text-center space-y-1">
                                    <p className="text-sm font-black text-white">
                                        {t('floor.drawer.pix.remainingAmount').replace(':amount', formatCurrency(pixAmount))}
                                    </p>
                                    {!pixApproved && !pixError && !generatingPix && (
                                        <p className="text-[10px] font-bold text-amber-400/90 tracking-wider">
                                            {t('floor.drawer.pix.countdown').replace(':time', formatCountdown(pixCountdown))}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {pixQrCode && !pixApproved && !pixError && (
                                <div className="w-full max-w-sm space-y-3 mx-auto shrink-0">
                                    <button
                                        onClick={handleCopyCode}
                                        className={`w-full py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                            copied 
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            {copied ? 'check' : 'content_copy'}
                                        </span>
                                        <span>{copied ? t('floor.drawer.pix.pixCopiar') + ' (Copiado!)' : t('floor.drawer.pix.pixCopiar')}</span>
                                    </button>

                                    <div className="flex items-center justify-center gap-2 bg-amber-500/5 border border-amber-500/10 py-2.5 px-4 rounded-xl">
                                        <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                            {t('floor.drawer.pix.waitingApproval')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action bar for PIX view (Voltar/Cancelar) */}
                        <div className="p-4 sm:p-8 pt-2 sm:pt-4 bg-white/[0.04] sm:bg-white/[0.02] border-t border-white/10 flex flex-col gap-2 sm:gap-3 shrink-0 pb-safe">
                            <button
                                onClick={stopPixTracking}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white hover:text-red-400 text-xs sm:text-sm font-black rounded-xl transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                <span>{t('floor.drawer.pix.cancel')}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Interaction Area - Scrollable Body */}
                        <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 sm:space-y-6 min-h-0">

                            <BillConference activeOrders={activeOrders} formatCurrency={formatCurrency} />

                            <ServiceFeeToggle 
                                serviceFeeEnabled={serviceFeeEnabled}
                                setServiceFeeEnabled={setServiceFeeEnabled}
                                serviceFeeAmount={serviceFeeAmount}
                                formatCurrency={formatCurrency}
                            />

                            <DiscountSection 
                                discountUnlocked={discountUnlocked}
                                discountAmount={discountAmount}
                                discountValue={discountValue}
                                discountMode={discountMode}
                                supervisorName={supervisorName}
                                applyDiscount={applyDiscount}
                                resetDiscount={resetDiscount}
                                formatCurrency={formatCurrency}
                            />

                            {/* Payment Methods Grid */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">{t('floor.drawer.checkout.payment_method_label')}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { method: 'dinheiro', icon: 'payments', label: t('floor.drawer.methods.dinheiro') },
                                        { method: 'pix', icon: 'qr_code_2', label: t('floor.drawer.methods.pix') },
                                        { method: 'credito', icon: 'credit_card', label: t('floor.drawer.methods.credito') },
                                        { method: 'debito', icon: 'credit_card', label: t('floor.drawer.methods.debito') },
                                    ].map(m => (
                                        <button
                                            key={m.method}
                                            onClick={() => {
                                                setCheckoutPaymentMethod(m.method);
                                                if (!paymentInputValue) {
                                                    const rem = Math.max(0, grandTotal - payments.reduce((s, p) => s + p.amount, 0));
                                                    if (rem > 0) setPaymentInputValue(rem.toFixed(2));
                                                }
                                            }}
                                            className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border transition-all duration-300 group ${checkoutPaymentMethod === m.method
                                                    ? 'bg-white/10 border-white/20 text-white shadow-lg scale-[1.02]'
                                                    : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/[0.08] hover:text-white'
                                                }`}
                                        >
                                            <div className={`size-8 sm:size-10 rounded-xl flex items-center justify-center transition-colors ${checkoutPaymentMethod === m.method ? 'bg-white text-black' : 'bg-white/5 text-white/40'
                                                }`}>
                                                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{m.icon}</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2 sm:space-y-3">
                                <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">{t('floor.drawer.checkout.payment_amount_label')}</label>
                                <div className="flex gap-2">
                                        <CustomNumberInput
                                            value={paymentInputValue}
                                            onChange={val => setPaymentInputValue(val)}
                                            onFocus={() => {
                                                if (!paymentInputValue) {
                                                    const rem = Math.max(0, grandTotal - payments.reduce((s, p) => s + p.amount, 0));
                                                    if (rem > 0) setPaymentInputValue(rem.toFixed(2));
                                                }
                                            }}
                                            prefix="R$"
                                            step={0.01}
                                            min={0.01}
                                            placeholder="0,00"
                                            className="w-full"
                                        />
                                    <button
                                        onClick={() => {
                                            const val = parseFloat(paymentInputValue);
                                            if (val > 0) {
                                                if (checkoutPaymentMethod === 'pix') {
                                                    generatePixPayment(val);
                                                } else {
                                                    setPayments(prev => [...prev, { id: Date.now(), method: checkoutPaymentMethod, amount: val, label: checkoutPaymentMethod }]);
                                                    setPaymentInputValue('');
                                                }
                                            }
                                        }}
                                        disabled={!paymentInputValue || parseFloat(paymentInputValue) <= 0}
                                        className="px-5 sm:px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:bg-white/10 text-black font-black rounded-[16px] sm:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-[24px] sm:text-[28px]">add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Payments List */}
                            {payments.length > 0 && (
                                <div className="space-y-3 animate-fade-in pb-4">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-widest">{t('floor.drawer.checkout.added_payments_label')}</p>
                                        <button onClick={() => setPayments([])} className="text-[10px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-tighter transition-colors">{t('floor.drawer.checkout.clear_all')}</button>
                                    </div>
                                    <div className="grid gap-2">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 sm:size-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[18px] sm:text-[22px] text-white/60">
                                                            {p.method === 'dinheiro' ? 'payments' : p.method === 'pix' ? 'qr_code_2' : 'credit_card'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-[12px] sm:text-sm font-black uppercase tracking-tight">
                                                            {t(`floor.drawer.methods.${p.method}`)}
                                                        </span>
                                                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                                                            {t('floor.drawer.checkout.payment_added')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <span className="text-base sm:text-lg font-black text-white">{formatCurrency(p.amount)}</span>
                                                    <button
                                                        onClick={() => setPayments(prev => prev.filter(x => x.id !== p.id))}
                                                        className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Bar - Fixed at bottom */}
                        <div className="p-4 sm:p-8 pt-2 sm:pt-4 bg-white/[0.04] sm:bg-white/[0.02] border-t border-white/10 flex flex-col gap-2 sm:gap-3 shrink-0 pb-safe">
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-[16px] sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-bold transition-all border border-white/5 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">print</span>
                                    <span>{t('floor.drawer.checkout.print_check')}</span>
                                </button>
                                <button
                                    onClick={onFinish}
                                    disabled={checkingOut || totalPaid < grandTotal - 0.01}
                                    className="flex-[2] py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:bg-white/20 text-black font-black rounded-[16px] sm:rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98]"
                                >
                                    {checkingOut ? (
                                        <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">check_circle</span>
                                            <span className="text-sm sm:text-base tracking-tight">{t('floor.drawer.checkout.finish_table')}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {totalPaid < grandTotal - 0.01 && (
                                <p className="text-center text-[9px] sm:text-[10px] font-bold text-orange-400/80 uppercase tracking-widest animate-pulse">
                                    {t('floor.drawer.checkout.missing_amount', { amount: formatCurrency(grandTotal - totalPaid) })}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
