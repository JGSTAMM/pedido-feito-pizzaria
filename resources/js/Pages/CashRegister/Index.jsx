import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import useI18n from '@/hooks/useI18n';

export default function Index({ register = null, summary = null, history = null, filters = {} }) {
    const { t, formatCurrency } = useI18n();
    const { flash, errors } = usePage().props;
    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(flash?.success || null);

    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [selectedHistory, setSelectedHistory] = useState(null);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/cash-register', { start_date: startDate, end_date: endDate }, { preserveState: true });
    };

    const handleOpen = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/cash-register/open', { opening_balance: parseFloat(openingBalance) || 0 }, {
            onSuccess: () => { setProcessing(false); setShowSuccess(t('cashRegister.messages.openSuccess')); setTimeout(() => setShowSuccess(null), 4000); },
            onError: () => setProcessing(false),
        });
    };

    const handleClose = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/cash-register/close', { closing_balance: parseFloat(closingBalance) || 0, notes }, {
            onSuccess: () => { setProcessing(false); setShowSuccess(t('cashRegister.messages.closeSuccess')); setTimeout(() => setShowSuccess(null), 4000); },
            onError: () => setProcessing(false),
        });
    };

    const methodLabels = {
        credito: t('cashRegister.methods.credito'),
        debito: t('cashRegister.methods.debito'),
        dinheiro: t('cashRegister.methods.dinheiro'),
        pix: t('cashRegister.methods.pix'),
    };
    const methodIcons = { credito: 'credit_card', debito: 'credit_card', dinheiro: 'payments', pix: 'qr_code_2' };

    return (
        <AppLayout>
            {/* Success/Error Toast */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl backdrop-blur-lg shadow-2xl animate-pulse">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-semibold text-sm">{showSuccess}</span>
                </div>
            )}
            {errors?.error && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-lg shadow-2xl">
                    <span className="material-symbols-outlined">error</span>
                    <span className="font-semibold text-sm">{errors.error}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">point_of_sale</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">{t('cashRegister.header.title')}</h2>
                            <p className="text-text-muted text-xs">{t('cashRegister.header.subtitle')}</p>
                        </div>
                    </div>
                    {register && (
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <span className="text-text-muted uppercase tracking-wider">{t('cashRegister.header.operator')}</span>
                            <span className="text-white">{t('cashRegister.header.defaultOperator')}</span>
                        </div>
                    )}
                </header>

                <div className="p-10">
                    {!register ? (
                        /* ── Open Register Form ── */
                        <div className="max-w-lg mx-auto">
                            <div className="rounded-2xl p-8 text-center mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
                                    <span className="material-symbols-outlined text-[32px]">lock_open</span>
                                </div>
                                <h3 className="text-white text-xl font-bold mb-2">{t('cashRegister.openCard.title')}</h3>
                                <p className="text-text-muted text-sm mb-6">{t('cashRegister.openCard.subtitle')}</p>
                                <form onSubmit={handleOpen} className="flex flex-col gap-4">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">{t('cashRegister.currencyPrefix')}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={openingBalance}
                                            onChange={(e) => setOpeningBalance(e.target.value)}
                                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-white text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder={t('cashRegister.zeroPlaceholder')}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">lock_open</span>
                                        {processing ? t('cashRegister.openCard.opening') : t('cashRegister.openCard.confirm')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* ── Open Register - Dashboard ── */
                        <div className="space-y-8">
                            {/* Status */}
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-white">{t('cashRegister.management.title')}</h3>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {t('cashRegister.management.openBadge')}
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="rounded-2xl p-5 border border-border-subtle" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <p className="text-text-muted text-xs uppercase font-bold tracking-wider">{t('cashRegister.cards.openingBalance')}</p>
                                    <p className="text-white text-2xl font-bold font-mono mt-1">{formatCurrency(summary?.opening_balance ?? 0)}</p>
                                    <p className="text-text-muted text-xs mt-1">{t('cashRegister.cards.changeFund')}</p>
                                </div>
                                <div className="rounded-2xl p-5 border border-emerald-500/20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <p className="text-emerald-400 text-xs uppercase font-bold tracking-wider">{t('cashRegister.cards.cashSales')}</p>
                                    <p className="text-emerald-400 text-2xl font-bold font-mono mt-1">{formatCurrency(summary?.methods?.dinheiro ?? 0)}</p>
                                    <p className="text-text-muted text-xs mt-1">{t('cashRegister.cards.cashInflow')}</p>
                                </div>
                                <div className="rounded-2xl p-5 border border-red-500/20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <p className="text-red-400 text-xs uppercase font-bold tracking-wider">{t('cashRegister.cards.totalChange')}</p>
                                    <p className="text-red-400 text-2xl font-bold font-mono mt-1">{formatCurrency(summary?.total_change ?? 0)}</p>
                                    <p className="text-text-muted text-xs mt-1">{t('cashRegister.cards.cashOutflow')}</p>
                                </div>
                                <div className="rounded-2xl p-5 border border-primary/20" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <p className="text-primary text-xs uppercase font-bold tracking-wider">{t('cashRegister.cards.drawerTotal')}</p>
                                    <p className="text-primary text-2xl font-bold font-mono mt-1">{formatCurrency(summary?.total_in_drawer ?? 0)}</p>
                                    <p className="text-text-muted text-xs mt-1">{t('cashRegister.cards.expectedPhysical')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Sales Summary */}
                                <div className="rounded-2xl p-6 border border-border-subtle" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <h4 className="text-white text-lg font-bold mb-4">{t('cashRegister.salesSummary.totalSales', { value: formatCurrency(summary?.total_sales ?? 0) })}</h4>
                                    <p className="text-text-muted text-xs uppercase font-bold tracking-wider mb-4">{t('cashRegister.salesSummary.title')}</p>
                                    <div className="space-y-3">
                                        {summary?.methods && Object.entries(summary.methods).map(([method, amount]) => (
                                            <div key={method} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-text-muted">{methodIcons[method] || 'payments'}</span>
                                                    <span className="text-sm font-medium text-white uppercase">{methodLabels[method] || method}</span>
                                                </div>
                                                <span className="text-sm font-bold text-white font-mono">{formatCurrency(amount)}</span>
                                            </div>
                                        ))}
                                        {(!summary?.methods || Object.keys(summary.methods).length === 0) && (
                                            <p className="text-text-muted text-sm text-center py-4">{t('cashRegister.salesSummary.empty')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Close Register Form */}
                                <div className="rounded-2xl p-6 border border-red-500/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="material-symbols-outlined text-red-400">lock</span>
                                        <h4 className="text-white text-lg font-bold">{t('cashRegister.closeForm.title')}</h4>
                                    </div>
                                    <form onSubmit={handleClose} className="space-y-4">
                                        <div>
                                            <label className="text-sm text-white font-medium mb-2 block">{t('cashRegister.closeForm.countedBalance')}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">{t('cashRegister.currencyPrefix')}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={closingBalance}
                                                    onChange={(e) => setClosingBalance(e.target.value)}
                                                    className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    placeholder={t('cashRegister.zeroPlaceholder')}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-white font-medium mb-2 block">{t('cashRegister.closeForm.notes')}</label>
                                            <input
                                                type="text"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder={t('cashRegister.closeForm.notesPlaceholder')}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">lock</span>
                                            {processing ? t('cashRegister.closeForm.closing') : t('cashRegister.closeForm.confirm')}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── HISTÓRICO DE CAIXAS ── */}
                    <div className="mt-16">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                                <span className="material-symbols-outlined text-primary text-[28px]">history</span>
                                {t('cashRegister.history.title')}
                            </h3>
                            <form onSubmit={handleFilter} className="flex items-center gap-3 w-full md:w-auto">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-background-dark border border-border-subtle rounded-xl px-4 w-full md:w-[150px] text-xs text-white uppercase tracking-wider font-bold focus:outline-none focus:border-primary/50 transition-all h-[42px] [&::-webkit-calendar-picker-indicator]:filter-invert-[100%]"
                                />
                                <span className="text-text-muted text-xs font-bold uppercase">{t('cashRegister.history.until')}</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-background-dark border border-border-subtle rounded-xl px-4 w-full md:w-[150px] text-xs text-white uppercase tracking-wider font-bold focus:outline-none focus:border-primary/50 transition-all h-[42px] [&::-webkit-calendar-picker-indicator]:filter-invert-[100%]"
                                />
                                <button
                                    type="submit"
                                    className="h-[42px] px-4 bg-surface hover:bg-surface-hover text-white font-bold rounded-xl transition-all border border-border-subtle hover:border-border-subtle-hover flex items-center justify-center shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </button>
                            </form>
                        </div>

                        {history && history.data.length > 0 ? (
                            <div className="bg-surface/50 border border-border-subtle rounded-2xl overflow-hidden backdrop-blur-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-border-subtle bg-background-dark/50">
                                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('cashRegister.history.table.opening')}</th>
                                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('cashRegister.history.table.closing')}</th>
                                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('cashRegister.history.table.finalBalance')}</th>
                                                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('cashRegister.history.table.action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle">
                                            {history.data.map(h => (
                                                <tr key={h.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-white text-sm font-medium">{h.opened_at}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-white text-sm font-medium">{h.closed_at}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-emerald-400 font-mono font-bold text-sm">{formatCurrency(h.closing_balance)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedHistory(h)}
                                                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all border border-primary/20 hover:border-primary opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                                            {t('cashRegister.history.table.summary')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t border-border-subtle bg-background-dark/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <span className="text-xs text-text-muted font-bold tracking-wider uppercase">{t('cashRegister.history.pagination.pageOf', { current: history.current_page, total: history.last_page })}</span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {history.links.map((link, i) => (
                                            <button
                                                key={i}
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all border flex items-center justify-center ${link.active ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'bg-surface border-border-subtle text-text-muted hover:text-white hover:border-border-subtle-hover'} disabled:opacity-30 disabled:cursor-not-allowed`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-background-dark/50 border border-border-subtle border-dashed rounded-2xl p-12 text-center">
                                <span className="material-symbols-outlined text-[48px] text-white/5 mb-3 block">history</span>
                                <p className="text-text-muted text-sm font-bold uppercase tracking-wider">{t('cashRegister.history.empty')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Flash Summary Modal ── */}
            {selectedHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={() => setSelectedHistory(null)} />
                    <div className="relative w-full max-w-lg bg-[#120F1D] rounded-2xl border border-border-subtle shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden max-h-[90vh] animate-scale-in">
                        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{t('cashRegister.modal.flashSummary')}</h3>
                                    <p className="text-xs text-text-muted font-bold mt-0.5">{selectedHistory.opened_at} - {selectedHistory.closed_at}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedHistory(null)} className="size-8 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-white transition-colors border border-border-subtle">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                            {/* Quebra de Caixa Alert */}
                            {(() => {
                                const diff = selectedHistory.summary.register_diff;
                                const isOk = Math.abs(diff) < 0.05; // margin of error
                                const isNegative = diff <= -0.05;
                                return (
                                    <div className={`p-4 rounded-xl border flex gap-3 shadow-lg ${isOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : (isNegative ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-primary/10 border-primary/30 text-primary')}`}>
                                        <span className="material-symbols-outlined mt-0.5 text-[24px]">{isOk ? 'check_circle' : (isNegative ? 'trending_down' : 'trending_up')}</span>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <p className="font-bold text-sm tracking-widest uppercase mb-1">
                                                    {isOk ? t('cashRegister.modal.cashChecked') : t('cashRegister.modal.cashMismatch')}
                                                </p>
                                                <div className="font-mono font-black text-lg bg-black/40 px-3 py-1 rounded-lg border border-current/10 whitespace-nowrap ml-2">
                                                    {isNegative ? '-' : (isOk ? '' : '+')} {formatCurrency(Math.abs(diff))}
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium opacity-80 leading-relaxed max-w-[90%]">
                                                {isOk
                                                    ? t('cashRegister.modal.noDiscrepancy')
                                                    : t('cashRegister.modal.discrepancyWithValue', { value: formatCurrency(Math.abs(diff)) })
                                                }
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Core Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface border border-border-subtle rounded-xl p-4">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">{t('cashRegister.modal.totalSales')}</span>
                                    <span className="text-xl font-mono font-black text-emerald-400">{formatCurrency(selectedHistory.summary.total_sales)}</span>
                                </div>
                                <div className="bg-surface border border-border-subtle rounded-xl p-4">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">{t('cashRegister.modal.expectedPhysical')}</span>
                                    <span className="text-xl font-mono font-black text-primary">{formatCurrency(selectedHistory.summary.expected_physical)}</span>
                                </div>
                                <div className="bg-surface border border-border-subtle rounded-xl p-4">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">{t('cashRegister.modal.totalOrders')}</span>
                                    <span className="text-xl font-black text-white">{selectedHistory.summary.order_count}</span>
                                </div>
                                <div className="bg-surface border border-border-subtle rounded-xl p-4">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-1">{t('cashRegister.modal.openingFund')}</span>
                                    <span className="text-xl font-mono font-black text-white">{formatCurrency(selectedHistory.opening_balance)}</span>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div>
                                <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-border-subtle flex-1"></span>
                                    {t('cashRegister.modal.receiptsAndSales')}
                                    <span className="w-4 h-px bg-border-subtle flex-1"></span>
                                </h4>
                                <div className="space-y-2">
                                    {selectedHistory.summary.methods && Object.entries(selectedHistory.summary.methods).map(([method, amount]) => (
                                        <div key={method} className="flex items-center justify-between p-3.5 rounded-xl bg-background-dark border border-white/5 transition-colors hover:border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-surface flex items-center justify-center text-text-muted border border-border-subtle">
                                                    <span className="material-symbols-outlined text-[18px]">{methodIcons[method] || 'payments'}</span>
                                                </div>
                                                <span className="text-sm font-bold text-white capitalize">{methodLabels[method] || method}</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-400 font-mono">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                    {(!selectedHistory.summary.methods || Object.keys(selectedHistory.summary.methods).length === 0) && (
                                        <p className="text-text-muted text-xs text-center font-bold tracking-wider uppercase py-4 bg-background-dark rounded-xl border border-white/5">{t('cashRegister.modal.noSales')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedHistory.notes && (
                                <div className="bg-[#1a1726] border border-orange-500/20 rounded-xl p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <span className="material-symbols-outlined text-8xl text-orange-400">edit_note</span>
                                    </div>
                                    <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 relative z-10 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">comment</span>
                                        {t('cashRegister.modal.operatorNotes')}
                                    </h4>
                                    <p className="text-sm text-white/90 relative z-10 font-medium leading-relaxed">{selectedHistory.notes}</p>
                                </div>
                            )}

                        </div>

                        <div className="p-5 border-t border-border-subtle bg-background-dark">
                            <button onClick={() => setSelectedHistory(null)} className="w-full py-3.5 bg-surface hover:bg-surface-hover text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-border-subtle">
                                {t('cashRegister.modal.closeSummary')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
