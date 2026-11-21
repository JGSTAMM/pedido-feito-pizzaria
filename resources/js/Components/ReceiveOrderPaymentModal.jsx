import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import CustomNumberInput from '@/Components/CustomNumberInput';

const COUNTER_PAYMENT_METHODS = [
    { method: 'dinheiro', icon: 'payments', label: 'Dinheiro' },
    { method: 'pix', icon: 'currency_exchange', label: 'Pix (Por Fora)' },
    { method: 'credito', icon: 'credit_card', label: 'Crédito' },
    { method: 'debito', icon: 'credit_card', label: 'Débito' },
];

export default function ReceiveOrderPaymentModal({ isOpen, onClose, order, onSuccess }) {
    const [payments, setPayments] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('dinheiro');
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const total = Number(order?.total ?? order?.total_amount ?? 0);
    const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const remaining = Math.max(0, Number((total - totalPaid).toFixed(2)));
    const change = Math.max(0, Number((totalPaid - total).toFixed(2)));
    const canConfirm = payments.length > 0 && totalPaid >= (total - 0.01) && !loading;

    useEffect(() => {
        if (isOpen && order) {
            setPayments([]);
            setSelectedMethod('dinheiro');
            setInputValue(total > 0 ? total.toFixed(2) : '');
            setError('');
            setLoading(false);
        }
    }, [isOpen, order?.id]);

    useEffect(() => {
        if (!isOpen) return;
        if (remaining > 0 && (!inputValue || parseFloat(inputValue) === 0)) {
            setInputValue(remaining.toFixed(2));
        }
    }, [remaining, isOpen]);

    if (!isOpen || !order) return null;

    const formatBRL = (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

    const handleQuickFullPayment = (method) => {
        const meta = COUNTER_PAYMENT_METHODS.find((m) => m.method === method);
        setPayments([{
            id: Date.now(),
            method,
            label: meta?.label || method,
            amount: total,
        }]);
        setSelectedMethod(method);
        setInputValue('');
        setError('');
    };

    const handleAddPayment = () => {
        const amount = parseFloat(inputValue);
        if (!selectedMethod || isNaN(amount) || amount <= 0) return;

        const meta = COUNTER_PAYMENT_METHODS.find((m) => m.method === selectedMethod);
        setPayments((prev) => [
            ...prev,
            {
                id: Date.now(),
                method: selectedMethod,
                label: meta?.label || selectedMethod,
                amount,
            },
        ]);
        setInputValue('');
        setError('');
    };

    const handleConfirm = async () => {
        if (!canConfirm) return;
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`/orders/${order.id}/pay`, {
                payments: payments.map((p) => ({
                    method: p.method,
                    amount: Number(p.amount),
                })),
            });

            onSuccess?.(res.data);
            onClose();
            router.reload({ preserveScroll: true });
        } catch (err) {
            const data = err?.response?.data || {};
            setError(data?.message || 'Não foi possível registrar o pagamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0D0D12]/80 backdrop-blur-md" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-[#12121A] border border-white/10 rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
                <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white leading-tight">
                                Receber Pedido #{order.short_code}
                            </h3>
                            <p className="text-xs text-text-muted">
                                {order.customer_name || 'Cliente Balcão'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-9 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Total</span>
                            <span className="text-lg font-black text-white font-mono">{formatBRL(total)}</span>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-center">
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider block">Restante</span>
                            <span className="text-lg font-black text-white font-mono">{formatBRL(remaining)}</span>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-center">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block">Troco</span>
                            <span className="text-lg font-black text-white font-mono">{formatBRL(change)}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                            Pagamento Rápido (Valor Total)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {COUNTER_PAYMENT_METHODS.map((pm) => (
                                <button
                                    key={pm.method}
                                    type="button"
                                    onClick={() => handleQuickFullPayment(pm.method)}
                                    className="py-3 px-2 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/35 text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-emerald-400">{pm.icon}</span>
                                    <span className="text-[11px] font-bold uppercase tracking-tight text-center">{pm.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-2.5">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            Ou Dividir Pagamento
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {COUNTER_PAYMENT_METHODS.map((pm) => (
                                <button
                                    key={pm.method}
                                    type="button"
                                    onClick={() => {
                                        setSelectedMethod(pm.method);
                                        if (!inputValue || parseFloat(inputValue) === 0) {
                                            if (remaining > 0) setInputValue(remaining.toFixed(2));
                                        }
                                    }}
                                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                                        selectedMethod === pm.method
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                                            : 'bg-white/5 border-white/5 text-text-muted hover:text-white'
                                    }`}
                                >
                                    {pm.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <CustomNumberInput
                                value={inputValue}
                                onChange={(val) => setInputValue(val)}
                                prefix="R$"
                                step={0.01}
                                min={0.01}
                                placeholder="0,00"
                                className="w-full"
                            />
                            <button
                                type="button"
                                onClick={handleAddPayment}
                                disabled={!inputValue || parseFloat(inputValue) <= 0}
                                className="px-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-black font-black rounded-xl transition-all flex items-center justify-center shrink-0"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>
                    </div>

                    {payments.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Pagamentos Lançados
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPayments([])}
                                    className="text-[10px] font-bold text-red-400 hover:underline uppercase"
                                >
                                    Limpar
                                </button>
                            </div>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between bg-white/5 px-3 py-2.5 rounded-xl border border-white/5">
                                        <span className="text-xs font-bold text-white uppercase">{p.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-emerald-400 font-mono">{formatBRL(p.amount)}</span>
                                            <button
                                                type="button"
                                                onClick={() => setPayments((prev) => prev.filter((item) => item.id !== p.id))}
                                                className="text-text-muted hover:text-red-400"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-red-400 font-bold text-center bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                            {error}
                        </p>
                    )}
                </div>

                <div className="p-5 sm:p-6 border-t border-white/5 bg-black/25 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                Confirmar Pagamento
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
