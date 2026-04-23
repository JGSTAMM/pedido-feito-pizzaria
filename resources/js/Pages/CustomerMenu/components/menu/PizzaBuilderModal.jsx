import React, { useEffect, useRef, useState, useMemo } from 'react';
import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';
import { useCart } from '../../hooks/useCart';
import { norm } from '@/utils/normalize';

const BROTO_FIXED_FEE = 5;

function parseIngredients(rawIngredients) {
    if (Array.isArray(rawIngredients)) return rawIngredients.map(v => String(v).trim()).filter(Boolean);
    if (typeof rawIngredients !== 'string') return [];
    return rawIngredients.split(/,\s*|\s+e\s+|\s+and\s+/i).map(i => i.trim()).filter(Boolean);
}

export default function PizzaBuilderModal({
    isOpen,
    onClose,
    pizzaSizeOptions = [],
    pizzaBorderOptions = [],
    pizzaFlavorProducts = [],
    preSelectedInstance = null
}) {
    const { t, formatCurrency, translateDynamic } = useI18n();
    const { addItem } = useCart();
    const previouslyFocusedElementRef = useRef(null);
    const closeButtonRef = useRef(null);

    // Local State
    const [selectedPizzaSize, setSelectedPizzaSize] = useState('');
    const [selectedFlavorInstances, setSelectedFlavorInstances] = useState([]);
    const [selectedBorderId, setSelectedBorderId] = useState('none');
    const [activeInstanceIndex, setActiveInstanceIndex] = useState(0);
    const [pizzaBuilderErrorKey, setPizzaBuilderErrorKey] = useState('');

    // New Feature States
    const [flavorSearchQuery, setFlavorSearchQuery] = useState('');

    // Derived State
    const selectedPizzaSizeOption = useMemo(() => {
        return pizzaSizeOptions.find(opt => String(opt.id) === String(selectedPizzaSize)) || pizzaSizeOptions[0] || null;
    }, [pizzaSizeOptions, selectedPizzaSize]);

    const selectedSizeMaxFlavors = Number(selectedPizzaSizeOption?.max_flavors || 1);

    const selectedBorderOption = useMemo(() => {
        return pizzaBorderOptions.find(b => String(b.id) === String(selectedBorderId)) || { id: 'none', name: t('digital_menu.pizza_builder.no_border'), price: 0 };
    }, [pizzaBorderOptions, selectedBorderId, t]);

    const flavorProductsMap = useMemo(() => new Map(pizzaFlavorProducts.map(p => [String(p.id), p])), [pizzaFlavorProducts]);

    const activeInstance = selectedFlavorInstances[activeInstanceIndex] || null;

    const pizzaBuilderPrice = useMemo(() => {
        if (!selectedPizzaSizeOption || selectedFlavorInstances.length === 0) return 0;

        const maxBasePrice = selectedFlavorInstances.reduce((max, inst) => {
            const product = flavorProductsMap.get(String(inst.flavorId));
            return Math.max(max, Number(product?.base_price || 0));
        }, 0);

        if (selectedPizzaSizeOption.is_special_broto_rule) {
            return (maxBasePrice / 2) + BROTO_FIXED_FEE;
        }

        return maxBasePrice + Number(selectedBorderOption?.price || 0);
    }, [selectedFlavorInstances, selectedPizzaSizeOption, selectedBorderOption, flavorProductsMap]);

    const filteredPizzaFlavors = useMemo(() => {
        if (!flavorSearchQuery.trim()) return pizzaFlavorProducts;
        const q = norm(flavorSearchQuery);
        return pizzaFlavorProducts.filter(f =>
            norm(f.name).includes(q) ||
            norm(f.ingredients).includes(q) ||
            norm(f.description).includes(q)
        );
    }, [pizzaFlavorProducts, flavorSearchQuery]);

    // Handlers
    const addFlavorInstance = (flavor) => {
        if (selectedFlavorInstances.length >= selectedSizeMaxFlavors) {
            setPizzaBuilderErrorKey('digital_menu.pizza_builder.max_flavors_limit');
            return;
        }
        setPizzaBuilderErrorKey('');
        const newInstance = { flavorId: flavor.id, removed: [] };
        setSelectedFlavorInstances(prev => {
            const next = [...prev, newInstance];
            setActiveInstanceIndex(next.length - 1);
            return next;
        });
    };

    const handleRemoveInstance = (index) => {
        setSelectedFlavorInstances(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (activeInstanceIndex >= next.length && next.length > 0) {
                setActiveInstanceIndex(next.length - 1);
            }
            return next;
        });
    };

    const addCustomPizzaToCart = () => {
        if (selectedFlavorInstances.length === 0) {
            setPizzaBuilderErrorKey('digital_menu.pizza_builder.select_flavors_required');
            return;
        }
        if (!selectedPizzaSizeOption) {
            setPizzaBuilderErrorKey('digital_menu.pizza_builder.select_size_required');
            return;
        }

        const sizeLabel = selectedPizzaSizeOption.name;

        const flavorCounts = {};
        selectedFlavorInstances.forEach(inst => {
            const p = flavorProductsMap.get(String(inst.flavorId));
            const name = translateDynamic(p?.name);
            const removedList = inst.removed || [];
            const key = `${name}${removedList.length ? ` (${t('digital_menu.pizza_builder.without_ingredient')} ${removedList.map(r => translateDynamic(r)).join(', ')})` : ''}`;
            flavorCounts[key] = (flavorCounts[key] || 0) + 1;
        });

        const flavorNames = Object.entries(flavorCounts).map(([key, count]) =>
            count > 1 ? `${key} (${count} ${t('digital_menu.pizza_builder.size_unit_plural')})` : key
        ).join(' / ');

        const borderNote = selectedBorderId === 'none' ? null : `${t('digital_menu.pizza_builder.border_label')}: ${translateDynamic(selectedBorderOption.name)}`;

        const itemNotes = borderNote;

        const customizations = selectedFlavorInstances
            .filter(inst => inst.removed && inst.removed.length > 0)
            .map(inst => {
                const p = flavorProductsMap.get(String(inst.flavorId));
                const flavorName = translateDynamic(p?.name);
                return `${flavorName}: sem ${inst.removed.map(r => translateDynamic(r)).join(', ')}`;
            })
            .join(' | ');

        const customPizzaId = `custom-pizza-${selectedPizzaSizeOption.id}-${selectedFlavorInstances.map(i => `${i.flavorId}-${(i.removed || []).slice().sort().join('_')}`).join('|')}`;

        addItem({
            id: customPizzaId,
            type: 'pizza',
            name: `Pizza ${sizeLabel} (${flavorNames})`,
            price: pizzaBuilderPrice,
            pizza_size_id: selectedPizzaSizeOption.id,
            flavor_instances: selectedFlavorInstances,
            notes: itemNotes,
            description: customizations || null,
            image_url: null,
        }, 1);

        onClose();
    };

    // Reset effects
    useEffect(() => {
        if (isOpen) {
            setSelectedPizzaSize(String(pizzaSizeOptions[0]?.id || ''));
            setFlavorSearchQuery('');

            if (preSelectedInstance) {
                setSelectedFlavorInstances([preSelectedInstance]);
                setActiveInstanceIndex(0);
            } else {
                setSelectedFlavorInstances([]);
            }

            setSelectedBorderId('none');
            setPizzaBuilderErrorKey('');
        }
    }, [isOpen, pizzaSizeOptions, preSelectedInstance]);

    // Handle Escape key with capture to ensure priority
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
            window.requestAnimationFrame(() => closeButtonRef.current?.focus());
        } else {
            document.body.style.overflow = '';
            if (previouslyFocusedElementRef.current instanceof HTMLElement) {
                previouslyFocusedElementRef.current.focus();
            }
        }
    }, [isOpen]);

    // Trim flavors if size drops
    useEffect(() => {
        if (selectedFlavorInstances.length > selectedSizeMaxFlavors) {
            setSelectedFlavorInstances(prev => prev.slice(0, selectedSizeMaxFlavors));
        }
    }, [selectedSizeMaxFlavors, selectedFlavorInstances.length]);

    if (!isOpen) return null;

    const sliceAngle = 360 / selectedSizeMaxFlavors;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-slate-100 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="pizza-builder-title"
                tabIndex="0"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        onClose();
                    }
                }}
                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:max-h-[85vh] bg-[#111116] sm:rounded-[2rem] sm:border sm:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500"
            >
                {/* Header */}
                <header className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 sticky top-0 shrink-0">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">{t('digital_menu.pizza_builder.title')}</p>
                        <h3 id="pizza-builder-title" className="text-xl font-black text-white leading-none">{t('digital_menu.pizza_builder.montar_pizza')}</h3>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label={t('digital_menu.cart.close_cart')}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-48">

                    {/* Visualizer */}
                    <div className="relative w-64 h-64 mx-auto mt-2 mb-6 transition-transform duration-500 hover:scale-105 select-none touch-none">
                        <div className="absolute inset-0 rounded-full bg-[#52301c] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-[#382012] overflow-hidden">
                            <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
                        </div>

                        {Array.from({ length: selectedSizeMaxFlavors }).map((_, index) => {
                            const startAngle = index * sliceAngle;
                            const maskStyle = {
                                WebkitMaskImage: `conic-gradient(from ${startAngle}deg, black 0deg, black ${sliceAngle}deg, transparent ${sliceAngle}deg)`,
                                maskImage: `conic-gradient(from ${startAngle}deg, black 0deg, black ${sliceAngle}deg, transparent ${sliceAngle}deg)`
                            };

                            const instance = selectedFlavorInstances[index];
                            const flavor = instance ? flavorProductsMap.get(String(instance.flavorId)) : null;
                            const flavorImg = flavor?.image_url || 'https://images.unsplash.com/photo-1604381536136-57f99201f92e?q=80&w=800&auto=format&fit=crop';

                            return (
                                <div
                                    key={`slice-${index}`}
                                    className={`absolute inset-0 rounded-full transition-all duration-700 ease-out origin-center cursor-pointer ${activeInstanceIndex === index && flavor ? 'ring-4 ring-primary/50 ring-inset z-10 scale-[1.05]' : flavor ? 'hover:scale-[1.02] hover:z-20' : ''}`}
                                    style={{
                                        ...maskStyle,
                                        opacity: flavor ? 1 : 0.15,
                                        transform: flavor ? (activeInstanceIndex === index ? 'scale(1.05)' : 'scale(1)') : 'scale(0.92)'
                                    }}
                                    onClick={() => flavor && setActiveInstanceIndex(index)}
                                >
                                    {flavor ? (
                                        <img src={flavorImg} alt={translateDynamic(flavor.name)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-black/60 flex items-center justify-center">
                                            <span
                                                className="material-symbols-outlined text-white/50 text-[50px] drop-shadow-lg"
                                                style={{ transform: `rotate(${startAngle + (sliceAngle / 2)}deg) translateY(-3.5rem)` }}
                                            >
                                                add_circle
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {Array.from({ length: selectedSizeMaxFlavors }).map((_, index) => {
                            if (selectedSizeMaxFlavors <= 1) return null;
                            const startAngle = index * sliceAngle;
                            return (
                                <div
                                    key={`divider-${index}`}
                                    className="absolute inset-0 origin-center pointer-events-none"
                                    style={{ transform: `rotate(${startAngle}deg)` }}
                                >
                                    <div className="absolute top-0 left-1/2 w-1 h-1/2 bg-black/40 -translate-x-1/2"></div>
                                    <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-[#382012]/80 -translate-x-1/2"></div>
                                </div>
                            );
                        })}

                        <div className="absolute inset-0 rounded-full shadow-[inset_0_10px_30px_rgba(255,255,255,0.3),inset_0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                    </div>

                    <div className="text-center pb-6 border-b border-white/5">
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{t('digital_menu.pizza_builder.preco_pizza')}</p>
                        <p className="text-3xl font-black text-primary drop-shadow-[0_2px_10px_rgba(139,92,246,0.3)]">{formatCurrency(pizzaBuilderPrice)}</p>
                    </div>

                    {/* Step 1: Size */}
                    <section className="space-y-4">
                        <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.tamanho')}</h4>
                        <div className="space-y-2">
                            {pizzaSizeOptions.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => setSelectedPizzaSize(String(size.id))}
                                    className={`w-full flex items-center justify-between rounded-[1rem] p-4 transition-all duration-300 border-2 ${selectedPizzaSize === String(size.id)
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                        : `${luccheseMenuTheme.glass} border-transparent text-slate-300 hover:bg-white/10 hover:text-white`
                                        }`}
                                >
                                    <span className="font-bold text-sm tracking-wide">{size.name}</span>
                                    <span className={`text-xs font-black tracking-wider px-3 py-1 rounded-full ${selectedPizzaSize === String(size.id) ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-400'
                                        }`}>
                                        {size.max_flavors} {size.max_flavors > 1 ? t('digital_menu.pizza_builder.size_unit_plural') : t('digital_menu.pizza_builder.size_unit_singular')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Selection Summary */}
                    {selectedFlavorInstances.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.sabores_da_pizza')}</h4>
                            </div>
                            <div className="flex flex-col gap-2">
                                {selectedFlavorInstances.map((inst, idx) => {
                                    const p = flavorProductsMap.get(String(inst.flavorId));
                                    const isActive = activeInstanceIndex === idx;
                                    const instIngredients = [...new Set(parseIngredients(p?.ingredients || p?.description))];

                                    return (
                                        <div key={`inst-${idx}`} className={`flex flex-col p-3 rounded-xl border-2 transition-all ${isActive ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5' : 'bg-white/5 border-transparent'}`}>
                                            <div className="flex items-center justify-between">
                                                <button onClick={() => setActiveInstanceIndex(idx)} className="flex-1 text-left flex items-center gap-3 group">
                                                    <span className={`w-6 h-6 rounded-full shrink-0 text-[10px] flex items-center justify-center font-black transition-colors ${isActive ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'}`}>{idx + 1}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>{translateDynamic(p?.name)}</p>
                                                            {isActive && (
                                                                <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">
                                                                    {t('digital_menu.pizza_builder.customizing') || 'Personalizando'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {inst.removed.length > 0 && !isActive && (
                                                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight mt-0.5 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                                                                {t('digital_menu.pizza_builder.with_removed_ingredients')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {!isActive && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-primary/30 text-[9px] uppercase font-black tracking-widest text-primary group-hover:bg-primary group-hover:text-white transition-all animate-bounce-subtle">
                                                            <span className="material-symbols-outlined text-[12px]">edit</span>
                                                            <span>{t('digital_menu.pizza_builder.customize')}</span>
                                                        </div>
                                                    )}
                                                </button>
                                                <button onClick={() => handleRemoveInstance(idx)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>

                                            {isActive && (
                                                <div className="mt-3 pt-3 border-t border-primary/20 animate-in slide-in-from-top-2 duration-300">
                                                    <p className="text-[10px] uppercase font-black text-primary/70 tracking-widest mb-2">
                                                        {t('digital_menu.pizza_builder.customizar_ingredientes')}
                                                    </p>
                                                    {instIngredients.length > 0 ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {instIngredients.map(ing => {
                                                                const isRemoved = inst.removed.includes(ing);
                                                                return (
                                                                    <button
                                                                        key={ing}
                                                                        onClick={() => {
                                                                            setSelectedFlavorInstances(prev => {
                                                                                const next = [...prev];
                                                                                const currRemoved = next[idx].removed;
                                                                                next[idx].removed = currRemoved.includes(ing) 
                                                                                    ? currRemoved.filter(i => i !== ing) 
                                                                                    : [...currRemoved, ing];
                                                                                return next;
                                                                            });
                                                                        }}
                                                                        className={`flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold transition-all border ${isRemoved
                                                                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                                            : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-4 h-4 flex items-center justify-center rounded-full shrink-0 ${isRemoved ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                                                                            {isRemoved ? <span className="material-symbols-outlined text-[10px] font-black">close</span> : <span className="material-symbols-outlined text-[10px] font-black">check</span>}
                                                                        </div>
                                                                        <span className={`text-left ${isRemoved ? 'line-through opacity-60' : ''}`}>{translateDynamic(ing)}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-500">{t('digital_menu.pizza_builder.no_ingredients_listed')}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <hr className="border-white/5 mx-2" />

                    {/* Step 2: Add Flavors */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.select_flavors')}</h4>
                            <span className="text-[10px] uppercase font-black px-3 py-1.5 bg-white/10 rounded-full text-slate-300 tracking-wider">
                                {selectedFlavorInstances.length} / {selectedSizeMaxFlavors}
                            </span>
                        </div>

                        {pizzaBuilderErrorKey && (
                            <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl text-red-200 text-sm font-bold flex items-center gap-3">
                                <span className="material-symbols-outlined">error</span>
                                {t(pizzaBuilderErrorKey, { count: selectedSizeMaxFlavors })}
                            </div>
                        )}

                        <div className="relative mb-3">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                            <input
                                type="text"
                                value={flavorSearchQuery}
                                onChange={(e) => setFlavorSearchQuery(e.target.value)}
                                placeholder={t('digital_menu.pizza_builder.search_flavors')}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                            {filteredPizzaFlavors.map((flavor) => (
                                <button
                                    key={flavor.id}
                                    onClick={() => addFlavorInstance(flavor)}
                                    className={`${luccheseMenuTheme.glass} border-transparent flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 hover:bg-white/10`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-500 shrink-0">
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-slate-300">{translateDynamic(flavor.name)}</p>
                                            {flavor.ingredients && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{translateDynamic(flavor.ingredients)}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right pl-4 shrink-0">
                                        <p className="font-black text-sm tracking-wide text-slate-400">
                                            {formatCurrency(flavor.base_price)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {filteredPizzaFlavors.length === 0 && (
                                <div className="text-center py-6 text-slate-500 text-sm font-medium">
                                    Nenhum sabor encontrado.
                                </div>
                            )}
                        </div>
                    </section>

                    <hr className="border-white/5 mx-2" />

                    {/* Step 3: Borders */}
                    <section className="space-y-4">
                        <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.escolher_borda')}</h4>
                        <div className="space-y-2">
                            {pizzaBorderOptions.map((border) => (
                                <button
                                    key={border.id}
                                    onClick={() => setSelectedBorderId(String(border.id))}
                                    className={`w-full flex items-center justify-between p-4 rounded-[1rem] transition-all duration-300 font-bold text-sm border-2 ${selectedBorderId === String(border.id)
                                        ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                                        : `${luccheseMenuTheme.glass} border-transparent text-slate-300 hover:bg-white/10 hover:text-white`
                                        }`}
                                >
                                    <span>{translateDynamic(border.name)}</span>
                                    {border.price > 0 && <span className="text-primary tracking-wide bg-primary/10 px-3 py-1 rounded-full text-xs">+ {formatCurrency(border.price)}</span>}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer sticky */}
                <div className="absolute bottom-0 w-full p-4 sm:p-6 z-20 pointer-events-none">
                    <button
                        onClick={addCustomPizzaToCart}
                        disabled={selectedFlavorInstances.length === 0}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-2xl pointer-events-auto ${selectedFlavorInstances.length > 0
                            ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 transform hover:scale-[1.02] active:scale-95'
                            : 'bg-[#222228] text-white/20 cursor-not-allowed border-2 border-white/5 shadow-none'
                            }`}
                    >
                        {t('digital_menu.pizza_builder.add_to_order')}
                        <span className="bg-black/20 px-3 py-1 rounded-full">{formatCurrency(pizzaBuilderPrice)}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
