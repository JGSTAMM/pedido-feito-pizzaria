import React, { useEffect, useRef, useState, useMemo } from 'react';
import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';
import { useCart } from '../../hooks/useCart';

const BROTO_FIXED_FEE = 5;

function parseIngredients(rawIngredients) {
    if (Array.isArray(rawIngredients)) return rawIngredients.map(v => String(v).trim()).filter(Boolean);
    if (typeof rawIngredients !== 'string') return [];
    return rawIngredients.split(',').map(i => i.trim()).filter(Boolean);
}

export default function PizzaBuilderModal({
    isOpen,
    onClose,
    pizzaSizeOptions = [],
    pizzaBorderOptions = [],
    pizzaFlavorProducts = []
}) {
    const { t, formatCurrency } = useI18n();
    const { addItem } = useCart();
    const previouslyFocusedElementRef = useRef(null);
    const closeButtonRef = useRef(null);

    // Local State
    const [selectedPizzaSize, setSelectedPizzaSize] = useState('');
    const [selectedFlavorIds, setSelectedFlavorIds] = useState([]);
    const [selectedBorderId, setSelectedBorderId] = useState('none');
    const [activeFlavorId, setActiveFlavorId] = useState('');
    const [removedIngredientsByFlavor, setRemovedIngredientsByFlavor] = useState({});
    const [pizzaBuilderErrorKey, setPizzaBuilderErrorKey] = useState('');

    // Derived State
    const selectedPizzaSizeOption = useMemo(() => {
        return pizzaSizeOptions.find(opt => String(opt.id) === String(selectedPizzaSize)) || pizzaSizeOptions[0] || null;
    }, [pizzaSizeOptions, selectedPizzaSize]);

    const selectedSizeMaxFlavors = Number(selectedPizzaSizeOption?.max_flavors || 1);

    const selectedBorderOption = useMemo(() => {
        return pizzaBorderOptions.find(b => String(b.id) === String(selectedBorderId)) || { id: 'none', name: t('digital_menu.pizza_builder.no_border'), price: 0 };
    }, [pizzaBorderOptions, selectedBorderId, t]);

    const selectedFlavorProducts = useMemo(() => {
        const map = new Map(pizzaFlavorProducts.map(p => [String(p.id), p]));
        return selectedFlavorIds.map(id => map.get(String(id))).filter(Boolean);
    }, [pizzaFlavorProducts, selectedFlavorIds]);

    const activeFlavor = useMemo(() => {
        if (!selectedFlavorProducts.length) return null;
        return selectedFlavorProducts.find(f => String(f.id) === String(activeFlavorId)) || selectedFlavorProducts[0];
    }, [selectedFlavorProducts, activeFlavorId]);

    const activeFlavorIngredients = useMemo(() => parseIngredients(activeFlavor?.ingredients || activeFlavor?.description), [activeFlavor]);

    const pizzaBuilderPrice = useMemo(() => {
        if (!selectedPizzaSizeOption || selectedFlavorProducts.length === 0) return 0;

        if (selectedPizzaSizeOption.is_special_broto_rule) {
            const firstFlavorPrice = Number(selectedFlavorProducts[0]?.base_price || 0);
            return (firstFlavorPrice / 2) + BROTO_FIXED_FEE;
        }

        const basePrice = selectedFlavorProducts.reduce((max, prod) => Math.max(max, Number(prod.base_price || 0)), 0);
        return basePrice + Number(selectedBorderOption?.price || 0);
    }, [selectedFlavorProducts, selectedPizzaSizeOption, selectedBorderOption]);

    // Handlers
    const handleToggleFlavor = (productId) => {
        const id = String(productId);
        setSelectedFlavorIds(prev => {
            if (prev.includes(id)) {
                setPizzaBuilderErrorKey('');
                return prev.filter(v => v !== id);
            }
            if (prev.length >= selectedSizeMaxFlavors) {
                setPizzaBuilderErrorKey('digital_menu.pizza_builder.max_flavors_limit');
                return prev;
            }
            setPizzaBuilderErrorKey('');
            return [...prev, id];
        });
    };

    const toggleIngredient = (flavorId, ingredient) => {
        const id = String(flavorId);
        setRemovedIngredientsByFlavor(prev => {
            const current = prev[id] || [];
            if (current.includes(ingredient)) {
                return { ...prev, [id]: current.filter(v => v !== ingredient) };
            }
            return { ...prev, [id]: [...current, ingredient] };
        });
    };

    const addCustomPizzaToCart = () => {
        if (selectedFlavorProducts.length === 0) {
            setPizzaBuilderErrorKey('digital_menu.pizza_builder.select_flavors_required');
            return;
        }
        if (!selectedPizzaSizeOption) {
            setPizzaBuilderErrorKey('digital_menu.pizza_builder.select_size_required');
            return;
        }

        const flavorNames = selectedFlavorProducts.map(p => p.name).join(' / ');
        const sizeLabel = selectedPizzaSizeOption.name;
        const removedNotes = selectedFlavorProducts.map(f => {
            const removed = removedIngredientsByFlavor[String(f.id)] || [];
            return removed.length ? `${f.name}: ${t('digital_menu.pizza_builder.without_ingredient') || 'Sem'} ${removed.join(', ')}` : null;
        }).filter(Boolean);

        const borderNote = selectedBorderOption.id === 'none' ? null : `${t('digital_menu.pizza_builder.border_label') || 'Borda'}: ${selectedBorderOption.name}`;
        const itemNotes = [borderNote, ...removedNotes].filter(Boolean).join(' | ');
        const customPizzaId = `custom-pizza-${selectedPizzaSizeOption.id}-${selectedFlavorIds.slice().sort().join('-')}`;

        addItem({
            id: customPizzaId,
            type: 'pizza',
            name: `Pizza ${sizeLabel} (${flavorNames})`,
            price: pizzaBuilderPrice,
            pizza_size_id: selectedPizzaSizeOption.id,
            flavor_ids: selectedFlavorProducts.map(p => p.id),
            notes: itemNotes || null,
            image_url: null,
        }, 1);

        onClose();
    };

    // Reset effects
    useEffect(() => {
        if (isOpen) {
            setSelectedPizzaSize(String(pizzaSizeOptions[0]?.id || ''));
            setSelectedFlavorIds([]);
            setSelectedBorderId('none');
            setRemovedIngredientsByFlavor({});
            setActiveFlavorId('');
            setPizzaBuilderErrorKey('');

            previouslyFocusedElementRef.current = document.activeElement;
            document.body.style.overflow = 'hidden';
            window.requestAnimationFrame(() => closeButtonRef.current?.focus());
        } else {
            document.body.style.overflow = '';
            if (previouslyFocusedElementRef.current instanceof HTMLElement) {
                previouslyFocusedElementRef.current.focus();
            }
        }
    }, [isOpen, pizzaSizeOptions]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Trim flavors if size drops
    useEffect(() => {
        setSelectedFlavorIds(prev => prev.length <= selectedSizeMaxFlavors ? prev : prev.slice(0, selectedSizeMaxFlavors));
    }, [selectedSizeMaxFlavors]);

    // Active flavor effect
    useEffect(() => {
        if (selectedFlavorProducts.length === 0) {
            setActiveFlavorId('');
        } else if (!selectedFlavorProducts.some(f => String(f.id) === String(activeFlavorId))) {
            setActiveFlavorId(String(selectedFlavorProducts[0]?.id || ''));
        }
    }, [selectedFlavorProducts, activeFlavorId]);

    if (!isOpen) return null;

    const sliceAngle = 360 / selectedSizeMaxFlavors;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 text-slate-100 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-[#111116] sm:rounded-[2rem] rounded-t-[2.5rem] border sm:border-slate-800 border-t-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <header className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 sticky top-0">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">{t('digital_menu.pizza_builder.title')}</p>
                        <h3 className="text-xl font-black text-white leading-none">{t('digital_menu.pizza_builder.montar_pizza')}</h3>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">

                    {/* Visualizer (2D Pie chart overlay mask) */}
                    <div className="relative w-64 h-64 mx-auto mt-2 mb-6 transition-transform duration-500 hover:scale-105 select-none touch-none">
                        {/* Pizza Board / Base Layer */}
                        <div className="absolute inset-0 rounded-full bg-[#52301c] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-[#382012] overflow-hidden">
                            <div className="w-full h-full opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
                        </div>

                        {/* Slices Layer */}
                        {Array.from({ length: selectedSizeMaxFlavors }).map((_, index) => {
                            const startAngle = index * sliceAngle;
                            const maskStyle = {
                                WebkitMaskImage: `conic-gradient(from ${startAngle}deg, black 0deg, black ${sliceAngle}deg, transparent ${sliceAngle}deg)`,
                                maskImage: `conic-gradient(from ${startAngle}deg, black 0deg, black ${sliceAngle}deg, transparent ${sliceAngle}deg)`
                            };

                            const flavor = selectedFlavorProducts[index];
                            const flavorImg = flavor?.image_url || 'https://images.unsplash.com/photo-1604381536136-57f99201f92e?q=80&w=800&auto=format&fit=crop';

                            return (
                                <div
                                    key={`slice-${index}`}
                                    className="absolute inset-0 rounded-full transition-all duration-700 ease-out origin-center"
                                    style={{
                                        ...maskStyle,
                                        opacity: flavor ? 1 : 0.15,
                                        transform: flavor ? 'scale(1)' : 'scale(0.92)'
                                    }}
                                >
                                    {flavor ? (
                                        <img src={flavorImg} alt={flavor.name} className="w-full h-full object-cover" />
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

                        {/* Slice Dividers */}
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

                        {/* Inner shadow/lighting for 3D realism */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_10px_30px_rgba(255,255,255,0.3),inset_0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                    </div>

                    <div className="text-center pb-6 border-b border-white/5">
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{t('digital_menu.pizza_builder.preco_pizza')}</p>
                        <p className="text-3xl font-black text-primary drop-shadow-[0_2px_10px_rgba(139,92,246,0.3)]">{formatCurrency(pizzaBuilderPrice)}</p>
                    </div>

                    {/* Step 1: Size */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.tamanho')}</h4>
                        </div>
                        <div className="space-y-2">
                            {pizzaSizeOptions.map((size) => (
                                <button
                                    key={size.id}
                                    onClick={() => setSelectedPizzaSize(String(size.id))}
                                    className={`w-full flex items-center justify-between rounded-[1rem] p-4 transition-all duration-300 border-2 ${selectedPizzaSize === String(size.id)
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                        : `${luccheseMenuTheme.glass} border-white/5 text-slate-300 hover:bg-white/10 hover:text-white`
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

                    {/* Step 2: Flavors */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.sabores_da_pizza')}</h4>
                            <span className="text-[10px] uppercase font-black px-3 py-1.5 bg-white/10 rounded-full text-slate-300 tracking-wider">
                                {selectedFlavorIds.length} / {selectedSizeMaxFlavors}
                            </span>
                        </div>

                        {pizzaBuilderErrorKey && (
                            <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl text-red-200 text-sm font-bold flex items-center gap-3">
                                <span className="material-symbols-outlined">error</span>
                                {t(pizzaBuilderErrorKey, { count: selectedSizeMaxFlavors })}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {pizzaFlavorProducts.map((flavor) => {
                                const isSelected = selectedFlavorIds.includes(String(flavor.id));
                                return (
                                    <button
                                        key={flavor.id}
                                        onClick={() => handleToggleFlavor(flavor.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                                            : `${luccheseMenuTheme.glass} border-transparent hover:bg-white/10`
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-slate-500'
                                                }`}>
                                                {isSelected && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{flavor.name}</p>
                                                {flavor.ingredients && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{flavor.ingredients}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right pl-4">
                                            <p className={`font-black text-sm tracking-wide ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                                                {formatCurrency(flavor.base_price)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Step 3: Borders */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.escolher_borda')}</h4>
                        </div>
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
                                    <span>{border.name}</span>
                                    {border.price > 0 && <span className="text-primary tracking-wide bg-primary/10 px-3 py-1 rounded-full text-xs">+ {formatCurrency(border.price)}</span>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 4: Ingredients Edit */}
                    {selectedFlavorProducts.length > 0 && (
                        <section className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="font-black text-white tracking-widest text-xs uppercase">{t('digital_menu.pizza_builder.customizar_ingredientes')}</h4>

                            {selectedFlavorProducts.length > 1 && (
                                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                                    {selectedFlavorProducts.map(flavor => (
                                        <button
                                            key={flavor.id}
                                            onClick={() => setActiveFlavorId(String(flavor.id))}
                                            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all ${activeFlavorId === String(flavor.id) || (!activeFlavorId && selectedFlavorProducts[0].id === flavor.id)
                                                ? 'bg-white text-black shadow-lg'
                                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                                }`}
                                        >
                                            {flavor.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeFlavorIngredients.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-2">
                                    {activeFlavorIngredients.map(ing => {
                                        const flvId = activeFlavorId || String(selectedFlavorProducts[0].id);
                                        const isRemoved = (removedIngredientsByFlavor[flvId] ?? []).includes(ing);
                                        return (
                                            <button
                                                key={ing}
                                                onClick={() => toggleIngredient(flvId, ing)}
                                                className={`flex items-center justify-between p-3.5 rounded-xl text-sm font-bold transition-all border-2 ${isRemoved
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                    : `${luccheseMenuTheme.glass} border-transparent text-white hover:bg-white/10`
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 flex items-center justify-center rounded-full ${isRemoved ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                                                        {isRemoved ? <span className="material-symbols-outlined text-[12px]">close</span> : <span className="material-symbols-outlined text-[12px]">check</span>}
                                                    </div>
                                                    <span className={isRemoved ? 'line-through opacity-60' : ''}>{ing}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 mt-2 font-medium">{t('digital_menu.pizza_builder.no_ingredients_listed')}</p>
                            )}
                        </section>
                    )}
                </div>

                {/* Footer sticky */}
                <div className="absolute bottom-0 w-full p-4 sm:p-6 bg-black/80 backdrop-blur-xl border-t border-white/10">
                    <button
                        onClick={addCustomPizzaToCart}
                        disabled={selectedFlavorProducts.length === 0}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-2xl ${selectedFlavorProducts.length > 0
                            ? 'bg-primary hover:bg-primary-hover text-white shadow-primary/20 transform hover:scale-[1.02] active:scale-95'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
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
