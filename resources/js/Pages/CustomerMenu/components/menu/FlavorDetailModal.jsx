import React, { useEffect, useRef, useState, useMemo } from 'react';
import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';
import AppImage from '@/Components/AppImage';
function parseIngredients(rawIngredients) {
    if (Array.isArray(rawIngredients)) return rawIngredients.map(v => String(v).trim()).filter(Boolean);
    if (typeof rawIngredients !== 'string') return [];
    return rawIngredients.split(/,\s*|\s+e\s+|\s+and\s+/i).map(i => i.trim()).filter(Boolean);
}

export default function FlavorDetailModal({ isOpen, onClose, product, onAddFlavor }) {
    const { t, formatCurrency, translateDynamic } = useI18n();
    const previouslyFocusedElementRef = useRef(null);
    const [removedIngredients, setRemovedIngredients] = useState([]);

    const ingredientsList = useMemo(() => {
        if (!product) return [];
        const rawIngredientsJson = product.ingredients_json;
        let structured = [];
        try {
            const parsed = typeof rawIngredientsJson === 'string'
                ? JSON.parse(rawIngredientsJson)
                : (Array.isArray(rawIngredientsJson) ? rawIngredientsJson : []);
            structured = (parsed || [])
                .filter(i => (i?.is_available ?? true) === true)
                .map(i => i?.name)
                .filter(Boolean);
        } catch {
            structured = [];
        }

        // If we got only 1 item and it looks like a compound string, split it
        if (structured.length === 1 && (/,\s*|\s+e\s+/i.test(structured[0]))) {
            return parseIngredients(structured[0]);
        }
        
        if (structured.length > 0) return structured;

        return parseIngredients(product.ingredients || product.description);
    }, [product]);

    // Handle Escape key with capture
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            previouslyFocusedElementRef.current = document.activeElement;
            document.body.style.overflow = 'hidden';
            setRemovedIngredients([]); // Reset when opening
        } else {
            document.body.style.overflow = '';
            if (previouslyFocusedElementRef.current instanceof HTMLElement) {
                previouslyFocusedElementRef.current.focus();
            }
        }
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const imageUrl = product.image_url || null;

    const toggleIngredient = (ing) => {
        setRemovedIngredients(prev =>
            prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
        );
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-slate-100 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                tabIndex="0"
                onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
                className="relative w-full max-h-[95dvh] sm:max-h-[85vh] max-w-lg bg-[#111116] sm:rounded-[2rem] rounded-t-[2.5rem] border sm:border-slate-800 border-t-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500"
            >
                {/* Close Button Mobile Header Overlay */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Hero Image */}
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black/20 shrink-0">
                    {imageUrl ? (
                        <AppImage src={imageUrl} alt={translateDynamic(product.name)} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.2),rgba(17,17,22,0.8)_60%)]">
                            <span className="material-symbols-outlined text-6xl text-primary/50">local_pizza</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-[#111116]/40 to-black/20 z-10"></div>
                    
                    {/* Category Badge overlay */}
                    <div className="absolute bottom-14 left-6 z-20">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md text-primary text-[9px] font-black uppercase tracking-widest leading-none">
                            {t(`digital_menu.pizza_categories.${(product.flavor_category || 'tradicional').toLowerCase()}`)}
                        </span>
                    </div>

                    {/* Title & Price overlay */}
                    <div className="absolute bottom-4 left-6 right-6 z-20 flex items-end justify-between gap-4">
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-none uppercase italic tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            {translateDynamic(product.name)}
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-primary drop-shadow-[0_2px_12px_rgba(139,92,246,0.6)] shrink-0">
                            {formatCurrency(product.price || product.base_price)}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-6 py-6 overflow-y-auto no-scrollbar">

                    {ingredientsList.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">{t('digital_menu.flavor_detail.ingredients')}</h4>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('digital_menu.home.click_to_add')}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {ingredientsList.map(ing => {
                                    const isRemoved = removedIngredients.includes(ing);
                                    return (
                                        <button
                                            key={ing}
                                            onClick={() => toggleIngredient(ing)}
                                            className={`flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all border-2 ${isRemoved
                                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                : `${luccheseMenuTheme.glass} border-transparent text-white hover:bg-white/10`
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 flex items-center justify-center rounded-full ${isRemoved ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                                                    {isRemoved ? <span className="material-symbols-outlined text-[12px]">close</span> : <span className="material-symbols-outlined text-[12px]">check</span>}
                                                </div>
                                                <span className={isRemoved ? 'line-through opacity-60' : ''}>
                                                    {translateDynamic(ing)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer sticky */}
                <div className="shrink-0 w-full p-6 bg-[#111116] sm:bg-black/80 sm:backdrop-blur-xl border-t border-white/10 flex gap-4 z-30">
                    <button
                        onClick={() => onAddFlavor(product, removedIngredients)}
                        className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_8px_30px_rgba(139,92,246,0.3)] transform hover:scale-[1.02] active:scale-95"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        {t('digital_menu.flavor_detail.add_flavor')}
                    </button>
                </div>
            </div>
        </div>
    );
}
