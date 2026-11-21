import { useState } from 'react';
import axios from 'axios';

export default function AdminPinUnlockModal({ isOpen, onClose, onUnlocked }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    const handlePinChange = (rawValue) => {
        const digitsOnly = String(rawValue || '').replace(/\D/g, '').slice(0, 4);
        setPin(digitsOnly);
        if (error) setError('');
    };

    const handleValidate = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4 || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/neighborhoods/validate-admin-pin', { pin });
            if (res.data?.valid) {
                const adminName = res.data.admin_name || 'Administrador';
                setPin('');
                onUnlocked(adminName);
                onClose();
            } else {
                setError('PIN do administrador inválido.');
            }
        } catch (err) {
            const status = err?.response?.status;
            const reason = err?.response?.data?.reason;

            if (status === 429) {
                setError('Muitas tentativas. Aguarde 1 minuto e tente novamente.');
            } else if (reason === 'not_configured') {
                setError('Nenhum PIN de administrador configurado. Defina em Configurações > Segurança.');
            } else {
                setError('PIN incorreto. Apenas o PIN de um usuário Administrador autoriza esta alteração.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0D0D12]/70 backdrop-blur-md" onClick={handleClose} />
            <form
                onSubmit={handleValidate}
                className="relative w-full max-w-md bg-[#12121A] border border-white/10 rounded-[28px] shadow-2xl p-6 sm:p-8 flex flex-col items-center"
            >
                <div className="size-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-orange-400 text-2xl">admin_panel_settings</span>
                </div>

                <h3 className="text-xl font-black text-white text-center mb-1">Autorização do Administrador</h3>
                <p className="text-xs text-text-muted text-center mb-6">
                    Esta conta não é de Administrador. Digite o PIN de 4 dígitos do Administrador para alterar taxas de tele-entrega.
                </p>

                <div className="w-full space-y-4">
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoFocus
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />

                    {error && (
                        <p className="text-xs text-red-400 font-bold text-center">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || pin.length !== 4}
                            className="flex-[2] py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? 'Validando...' : 'Liberar Edição'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
