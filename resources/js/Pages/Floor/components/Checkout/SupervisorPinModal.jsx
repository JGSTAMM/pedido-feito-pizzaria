import React, { useState } from 'react';
import useI18n from '@/hooks/useI18n';
import axios from 'axios';

export default function SupervisorPinModal({ isOpen, onClose, onUnlock }) {
    const { t } = useI18n();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleValidate = async () => {
        if (!pin) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/floor/validate-supervisor-pin', { pin });
            if (res.data.valid) {
                onUnlock(res.data.supervisor_name, res.data.supervisor_id);
                setPin('');
                onClose();
            } else {
                setError(t('floor.drawer.checkout.invalid_pin'));
            }
        } catch (err) {
            setError(t('floor.drawer.checkout.invalid_pin'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0D0D12]/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-[#12121A] border border-white/10 rounded-[28px] shadow-2xl p-6 flex flex-col items-center animate-scale-in">
                <div className="size-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-orange-400 text-2xl">lock</span>
                </div>
                
                <h3 className="text-xl font-black text-white text-center mb-1">{t('floor.drawer.checkout.supervisor_pin_title')}</h3>
                <p className="text-xs text-text-muted text-center mb-6">{t('floor.drawer.checkout.supervisor_pin_subtitle')}</p>

                <div className="w-full space-y-4">
                    <input
                        type="password"
                        inputMode="numeric"
                        autoFocus
                        placeholder="****"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                    
                    {error && (
                        <p className="text-xs text-red-400 font-bold text-center animate-pulse">{error}</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            {t('floor.drawer.pix.cancel')}
                        </button>
                        <button
                            onClick={handleValidate}
                            disabled={loading || !pin}
                            className="flex-[2] py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-black rounded-xl transition-all shadow-[0_10px_20px_-10px_rgba(249,115,22,0.5)] active:scale-95 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">key</span>
                                    {t('floor.drawer.checkout.unlock')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
