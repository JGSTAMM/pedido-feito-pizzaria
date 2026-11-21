import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function PinDeleteConfirmModal({
    isOpen,
    onClose,
    title = 'Confirmar Exclusão',
    description = 'Esta ação cancela o lançamento e remove dos totais do caixa e cozinha. Digite o código PIN de 4 dígitos para autorizar.',
    targetLabel = '',
    endpoint,
    onSuccess,
}) {
    const [pin, setPin] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setReason('');
            setError('');
            setLoading(false);
        }
    }, [isOpen, endpoint]);

    if (!isOpen || !endpoint) return null;

    const handleClose = () => {
        if (loading) return;
        setPin('');
        setReason('');
        setError('');
        onClose();
    };

    const handlePinChange = (rawValue) => {
        const digitsOnly = String(rawValue || '').replace(/\D/g, '').slice(0, 4);
        setPin(digitsOnly);
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4 || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await axios.post(endpoint, {
                pin,
                reason: reason.trim() || null,
            });

            setPin('');
            setReason('');
            onSuccess?.(res.data);
            onClose();
            router.reload({ preserveScroll: true });
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data || {};
            const serverReason = data?.reason;

            if (status === 429) {
                setError('Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.');
            } else if (serverReason === 'not_configured') {
                setError('Nenhum PIN de supervisor configurado. Defina em Configurações > Segurança.');
            } else if (serverReason === 'invalid_pin') {
                setError('Código PIN incorreto. Tente novamente com o PIN de 4 dígitos do supervisor/administrador.');
            } else {
                setError(data?.message || data?.errors?.pin?.[0] || 'Não foi possível validar o PIN.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0D0D12]/75 backdrop-blur-md" onClick={handleClose} />
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-[#12121A] border border-red-500/25 rounded-[28px] shadow-2xl p-6 sm:p-7 flex flex-col items-center animate-scale-in"
            >
                <div className="size-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-400 text-2xl">delete_forever</span>
                </div>

                <h3 className="text-xl font-black text-white text-center mb-1">{title}</h3>
                <p className="text-xs text-text-muted text-center leading-relaxed mb-4">{description}</p>

                {targetLabel && (
                    <div className="w-full px-3.5 py-2.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                        <span className="text-xs font-bold text-red-200">{targetLabel}</span>
                    </div>
                )}

                <div className="w-full space-y-3.5">
                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-1.5">
                            Motivo (Opcional)
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={255}
                            placeholder="Ex: Lançado errado, desistência..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/60 focus:outline-none focus:border-red-500/40 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 block mb-1.5">
                            Código PIN do Supervisor (4 dígitos) *
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            autoFocus
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 font-bold text-center bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pin.length !== 4}
                            className="flex-[2] py-3 bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-500/20"
                        >
                            {loading ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                                    Confirmar Exclusão
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
