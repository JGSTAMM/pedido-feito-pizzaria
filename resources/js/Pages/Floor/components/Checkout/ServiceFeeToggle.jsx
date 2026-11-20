import React from 'react';
import useI18n from '@/hooks/useI18n';
import CustomNumberInput from '@/Components/CustomNumberInput';

const QUICK_FEE_PRESETS = [10, 12, 15];

export default function ServiceFeeToggle({
    serviceFeeEnabled,
    setServiceFeeEnabled,
    serviceFeeMode = 'percent',
    serviceFeeValue = 10,
    setServiceFeeValue,
    changeServiceFeeMode,
    selectServiceFeePreset,
    serviceFeeAmount,
    formatCurrency,
}) {
    const { t } = useI18n();

    const formattedBadge = serviceFeeMode === 'percent'
        ? `${Number(serviceFeeValue || 0)}%`
        : t('floor.drawer.checkout.service_fee_fixed_badge');

    const handleValueChange = (nextVal) => {
        if (typeof setServiceFeeValue === 'function') {
            setServiceFeeValue(Math.max(0, Number(nextVal) || 0));
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 p-4 rounded-[20px] mb-4 transition-all space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white">
                        {t('floor.drawer.checkout.service_fee')} ({formattedBadge})
                    </span>
                    <span className={`text-xs mt-0.5 ${serviceFeeEnabled ? 'text-emerald-400 font-bold' : 'text-text-muted'}`}>
                        {serviceFeeEnabled ? formatCurrency(serviceFeeAmount) : t('floor.drawer.checkout.removed')}
                    </span>
                </div>

                <button
                    type="button"
                    aria-label={t('floor.drawer.checkout.service_fee')}
                    aria-pressed={serviceFeeEnabled}
                    onClick={() => setServiceFeeEnabled(!serviceFeeEnabled)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                        serviceFeeEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            serviceFeeEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            {serviceFeeEnabled && (
                <div className="pt-3 border-t border-white/10 space-y-2.5 animate-fade-in">
                    {/* Quick percentage presets */}
                    <div className="grid grid-cols-3 gap-2">
                        {QUICK_FEE_PRESETS.map((preset) => {
                            const isActive =
                                serviceFeeMode === 'percent' &&
                                Number(serviceFeeValue) === preset;

                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => selectServiceFeePreset?.(preset)}
                                    className={`py-1.5 px-2 rounded-xl text-xs font-black border transition-all active:scale-95 ${
                                        isActive
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                            : 'bg-black/20 border-white/5 text-text-muted hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    {preset}%
                                </button>
                            );
                        })}
                    </div>

                    {/* Mode switcher (% or R$) + custom value input */}
                    <div className="flex gap-2 items-center">
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 shrink-0">
                            <button
                                type="button"
                                onClick={() => changeServiceFeeMode?.('percent')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    serviceFeeMode === 'percent'
                                        ? 'bg-white/15 text-white shadow'
                                        : 'text-text-muted hover:text-white'
                                }`}
                            >
                                %
                            </button>
                            <button
                                type="button"
                                onClick={() => changeServiceFeeMode?.('absolute')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    serviceFeeMode === 'absolute'
                                        ? 'bg-white/15 text-white shadow'
                                        : 'text-text-muted hover:text-white'
                                }`}
                            >
                                R$
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <CustomNumberInput
                                aria-label={
                                    serviceFeeMode === 'percent'
                                        ? t('floor.drawer.checkout.service_fee_percent_label')
                                        : t('floor.drawer.checkout.service_fee_amount_label')
                                }
                                value={serviceFeeValue}
                                onChange={handleValueChange}
                                prefix={serviceFeeMode === 'absolute' ? 'R$' : '%'}
                                step={1}
                                min={0}
                                max={serviceFeeMode === 'percent' ? 500 : 999999}
                                placeholder="0"
                                className="w-full !h-10"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
