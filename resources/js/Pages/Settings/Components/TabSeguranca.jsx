import { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { Card, Label } from './Shared';

export default function TabSeguranca({ supervisorSecurity = {} }) {
    const { t } = useI18n();
    const supervisors = Array.isArray(supervisorSecurity.supervisors)
        ? supervisorSecurity.supervisors
        : [];
    const currentUserId = supervisorSecurity.current_user_id || '';
    const defaultSupervisorId =
        supervisors.find((s) => s.id === currentUserId)?.id || supervisors[0]?.id || '';

    const [showPin, setShowPin] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        user_id: defaultSupervisorId,
        pin: '',
        pin_confirmation: '',
    });

    useEffect(() => {
        if (!data.user_id && defaultSupervisorId) {
            setData('user_id', defaultSupervisorId);
        }
    }, [defaultSupervisorId, data.user_id]);

    const selectedSupervisor =
        supervisors.find((s) => s.id === data.user_id) || supervisors[0] || null;

    const handlePinChange = (field, rawValue) => {
        const digitsOnly = String(rawValue || '').replace(/\D/g, '').slice(0, 4);
        setData(field, digitsOnly);
        if (errors.pin) {
            clearErrors('pin');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.pin.length !== 4 || data.pin_confirmation.length !== 4) {
            return;
        }

        post('/settings/supervisor-pin', {
            preserveScroll: true,
            onSuccess: () => {
                reset('pin', 'pin_confirmation');
            },
        });
    };

    const handleRemovePin = (supervisor) => {
        if (!supervisor?.has_pin || removingId) return;
        if (!window.confirm(t('settings.security.confirm_remove_pin'))) return;

        setRemovingId(supervisor.id);
        router.delete(`/settings/supervisor-pin/${supervisor.id}`, {
            preserveScroll: true,
            onFinish: () => setRemovingId(null),
        });
    };

    const canSubmit =
        !processing &&
        Boolean(selectedSupervisor?.id) &&
        data.pin.length === 4 &&
        data.pin_confirmation.length === 4;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="size-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                            <span className="material-symbols-outlined text-[24px]">shield_lock</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{t('settings.security.title')}</h3>
                            <p className="text-sm text-text-muted mt-0.5">{t('settings.security.subtitle')}</p>
                        </div>
                    </div>

                    {selectedSupervisor && (
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                                selectedSupervisor.has_pin
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                        >
                            <span
                                className={`size-2 rounded-full ${
                                    selectedSupervisor.has_pin ? 'bg-emerald-400' : 'bg-amber-400'
                                }`}
                            />
                            {selectedSupervisor.has_pin
                                ? t('settings.security.status_configured')
                                : t('settings.security.status_not_configured')}
                        </span>
                    )}
                </div>

                <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-200/90 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-orange-400 shrink-0 mt-0.5">info</span>
                    <span>{t('settings.security.usage_hint')}</span>
                </div>

                {supervisors.length === 0 ? (
                    <div className="p-6 text-center text-sm text-text-muted border border-border-subtle rounded-xl bg-background-dark/40">
                        {t('settings.security.no_supervisors')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>{t('settings.security.supervisor_label')}</Label>
                            <select
                                value={data.user_id}
                                onChange={(e) => {
                                    clearErrors();
                                    setData('user_id', e.target.value);
                                }}
                                className="w-full bg-background-dark border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                            >
                                {supervisors.map((supervisor) => (
                                    <option key={supervisor.id} value={supervisor.id}>
                                        {supervisor.name} ({supervisor.email})
                                        {supervisor.id === currentUserId
                                            ? ` — ${t('settings.security.current_user_badge')}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.user_id}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label>{t('settings.security.new_pin_label')}</Label>
                                <div className="relative">
                                    <input
                                        type={showPin ? 'text' : 'password'}
                                        inputMode="numeric"
                                        pattern="\d{4}"
                                        maxLength={4}
                                        autoComplete="new-password"
                                        placeholder={t('settings.security.pin_placeholder')}
                                        value={data.pin}
                                        onChange={(e) => handlePinChange('pin', e.target.value)}
                                        className="w-full bg-background-dark border border-border-subtle rounded-xl pl-4 pr-12 py-3 text-lg font-bold tracking-[0.35em] text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin((prev) => !prev)}
                                        aria-label={
                                            showPin
                                                ? t('settings.security.hide_pin')
                                                : t('settings.security.show_pin')
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPin ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label>{t('settings.security.confirm_pin_label')}</Label>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    inputMode="numeric"
                                    pattern="\d{4}"
                                    maxLength={4}
                                    autoComplete="new-password"
                                    placeholder={t('settings.security.pin_placeholder')}
                                    value={data.pin_confirmation}
                                    onChange={(e) => handlePinChange('pin_confirmation', e.target.value)}
                                    className="w-full bg-background-dark border border-border-subtle rounded-xl px-4 py-3 text-lg font-bold tracking-[0.35em] text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {errors.pin && (
                            <p className="text-red-400 text-xs font-bold">{errors.pin}</p>
                        )}

                        <p className="text-xs text-text-muted">{t('settings.security.digits_hint')}</p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-subtle">
                            {selectedSupervisor?.has_pin ? (
                                <button
                                    type="button"
                                    disabled={removingId === selectedSupervisor.id}
                                    onClick={() => handleRemovePin(selectedSupervisor)}
                                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    {t('settings.security.remove_pin')}
                                </button>
                            ) : (
                                <span />
                            )}

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black font-black text-sm rounded-xl transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                {processing
                                    ? t('settings.security.saving_pin')
                                    : t('settings.security.save_pin')}
                            </button>
                        </div>
                    </form>
                )}
            </Card>

            {supervisors.length > 0 && (
                <Card>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                        {t('settings.security.supervisors_list_title')}
                    </h4>
                    <div className="space-y-2.5">
                        {supervisors.map((supervisor) => {
                            const isSelected = selectedSupervisor?.id === supervisor.id;
                            return (
                                <button
                                    key={supervisor.id}
                                    type="button"
                                    onClick={() => {
                                        clearErrors();
                                        setData('user_id', supervisor.id);
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                                        isSelected
                                            ? 'bg-orange-500/10 border-orange-500/40'
                                            : 'bg-background-dark border-border-subtle hover:border-white/20'
                                    }`}
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                            <span>{supervisor.name}</span>
                                            {supervisor.id === currentUserId && (
                                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                                                    {t('settings.security.current_user_badge')}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {supervisor.email} · {supervisor.role}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                            supervisor.has_pin
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${
                                                supervisor.has_pin ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}
                                        />
                                        {supervisor.has_pin
                                            ? t('settings.security.status_configured')
                                            : t('settings.security.status_not_configured')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}
