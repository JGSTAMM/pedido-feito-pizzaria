import React, { useState } from 'react';
import useI18n from '@/hooks/useI18n';
import SupervisorPinModal from './SupervisorPinModal';
import CustomNumberInput from '@/Components/CustomNumberInput';

export default function DiscountSection({ 
    discountUnlocked, 
    discountAmount, 
    discountValue,
    discountMode,
    supervisorName, 
    applyDiscount, 
    resetDiscount,
    formatCurrency
}) {
    const { t } = useI18n();
    const [showPinModal, setShowPinModal] = useState(false);
    
    // Local state for the input before applying
    const [localVal, setLocalVal] = useState(discountValue || '');
    const [localMode, setLocalMode] = useState(discountMode || 'absolute');

    const handleApply = () => {
        if (!localVal || parseFloat(localVal) <= 0) return;
        applyDiscount(parseFloat(localVal), localMode, supervisorName, null); 
        // We reuse the existing supervisorName and Id that was unlocked
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[20px] p-4 mb-4 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400">loyalty</span>
                    <span className="text-sm font-black text-white">{t('floor.drawer.checkout.discount')}</span>
                </div>
                {discountUnlocked && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {t('floor.drawer.checkout.unlocked_by')} {supervisorName}
                        </span>
                        <button onClick={resetDiscount} className="text-text-muted hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                        </button>
                    </div>
                )}
            </div>

            {!discountUnlocked ? (
                <button 
                    onClick={() => setShowPinModal(true)}
                    className="w-full py-3 px-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl flex items-center justify-center gap-2 text-orange-400 font-bold transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span className="text-xs uppercase tracking-widest">{t('floor.drawer.checkout.unlock_discount')}</span>
                </button>
            ) : (
                <div className="space-y-3 animate-fade-in">
                    <div className="flex gap-2">
                        <div className="flex-1 flex bg-black/20 rounded-xl p-1 border border-white/5">
                            <button 
                                onClick={() => setLocalMode('absolute')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${localMode === 'absolute' ? 'bg-white/10 text-white shadow' : 'text-text-muted hover:text-white'}`}
                            >
                                R$
                            </button>
                            <button 
                                onClick={() => setLocalMode('percent')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${localMode === 'percent' ? 'bg-white/10 text-white shadow' : 'text-text-muted hover:text-white'}`}
                            >
                                %
                            </button>
                        </div>
                        <div className="flex-[2]">
                            <CustomNumberInput
                                value={localVal}
                                onChange={setLocalVal}
                                prefix={localMode === 'absolute' ? 'R$' : ''}
                                suffix={localMode === 'percent' ? '%' : ''}
                                step={localMode === 'percent' ? 1 : 0.01}
                                min={0}
                                placeholder="0"
                                className="w-full !py-2 !text-sm"
                            />
                        </div>
                        <button
                            onClick={handleApply}
                            className="px-4 bg-orange-500 hover:bg-orange-400 text-black font-black rounded-xl transition-all active:scale-95"
                        >
                            {t('floor.drawer.checkout.apply')}
                        </button>
                    </div>

                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                            <span className="text-xs font-bold text-orange-400/80 uppercase tracking-widest">{t('floor.drawer.checkout.applied')}</span>
                            <span className="text-sm font-black text-orange-400">-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                </div>
            )}

            <SupervisorPinModal 
                isOpen={showPinModal} 
                onClose={() => setShowPinModal(false)}
                onUnlock={(name, id) => {
                    // Set it as unlocked with 0 value initially
                    applyDiscount(0, 'absolute', name, id);
                }}
            />
        </div>
    );
}
