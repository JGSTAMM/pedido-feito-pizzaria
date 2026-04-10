import { useState } from 'react';
import useI18n from '@/hooks/useI18n';
import axios from 'axios';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function IdentityModal({ isOpen, onClose, onSuccess }) {
    const { t } = useI18n();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 7) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }

        setPhone(formatted);
    };

    const handleNext = async (e) => {
        e.preventDefault();
        setError('');

        const plainPhone = phone.replace(/\D/g, '');
        if (plainPhone.length < 10) {
            setError(t('digital_menu.identity.errors.phone_required'));
            return;
        }

        setIsLoading(true);

        try {
            // First check if the user exists
            const { data } = await axios.post('/api/customers/identify', {
                phone: plainPhone,
                name: '' // Empty name to just look up by phone initially
            });

            if (data.found && data.customer?.name) {
                // Returning user
                localStorage.setItem('customerIdentity', JSON.stringify(data.customer));
                setSuccessMessage(t('digital_menu.identity.welcome_back', { name: data.customer.name }));
                setTimeout(() => onSuccess(data.customer), 1500);
            } else {
                // New user (or existing but no name attached), move to name step
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            // Default to asking name if network or other error prevents simple lookup
            setStep(2);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (name.trim().length < 3) {
            setError(t('digital_menu.identity.errors.name_required'));
            return;
        }

        const plainPhone = phone.replace(/\D/g, '');

        setIsLoading(true);

        try {
            const { data } = await axios.post('/api/customers/identify', {
                phone: plainPhone,
                name: name.trim()
            });

            if (data.customer) {
                localStorage.setItem('customerIdentity', JSON.stringify(data.customer));
                setSuccessMessage(t('digital_menu.identity.registration_complete', { name: data.customer.name }));
                setTimeout(() => onSuccess(data.customer), 1500);
            } else {
                setError(t('digital_menu.identity.errors.save_failed'));
            }
        } catch (err) {
            setError(t('digital_menu.identity.errors.generic_error'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className={`${luccheseMenuTheme.glass} w-full max-w-sm rounded-[32px] border border-white/10 bg-[#131118] p-6 shadow-2xl relative overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative glow */}
                <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    {successMessage ? (
                        <div className="py-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-white">{successMessage}</h2>
                            <p className="text-sm font-medium text-text-muted mt-2">{t('digital_menu.identity.redirecting')}</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-xl font-black text-white italic tracking-tight mb-2">
                                    {step === 1 ? t('digital_menu.identity.title_step_1') : t('digital_menu.identity.title_step_2')}
                                </h2>
                                <p className="text-xs font-semibold text-text-muted">
                                    {step === 1 ? t('digital_menu.identity.subtitle_step_1') : t('digital_menu.identity.subtitle_step_2')}
                                </p>
                            </div>

                            <form onSubmit={step === 1 ? handleNext : handleSubmit} className="w-full space-y-5">
                                {step === 1 ? (
                                    <div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            placeholder={t('digital_menu.identity.placeholders.whatsapp')}
                                            inputMode="numeric"
                                            autoFocus
                                            className="w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-4 text-center text-xl font-black text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none shadow-inner tracking-widest"
                                        />
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-4 duration-300">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={t('digital_menu.identity.placeholders.name')}
                                            autoFocus
                                            className="w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-4 text-center text-lg font-bold text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none shadow-inner"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                                        <p className="text-[11px] font-bold text-red-400">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full rounded-full py-4 font-black uppercase text-[11px] tracking-widest transition-all shadow-[0_4px_14px_rgba(90,90,246,0.2)] ${isLoading
                                        ? 'bg-[#1E1B2A] text-white/50 cursor-not-allowed shadow-none border border-white/5'
                                        : 'bg-[#5a5af6] text-white hover:bg-[#4b4be5] hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {isLoading ? t('digital_menu.identity.processing') : t('digital_menu.identity.continue_action')}
                                </button>

                                {step === 1 && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
                                    >
                                        {t('digital_menu.identity.cancel_action')}
                                    </button>
                                )}
                                {step === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); setError(''); }}
                                        className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                        {t('digital_menu.identity.back_action')}
                                    </button>
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
