import { useState, useMemo } from 'react';
import { norm } from '@/utils/normalize';

const BORDER_PRICE = 20.00;

/**
 * Calculate pizza price mirroring PizzaPriceService exactly.
 *  Grande: max(flavor.base_price)
 *  Broto:  (flavor.base_price / 2) + 5
 */
function calculatePizzaPrice(size, selectedFlavors, selectedBorder) {
    if (!size || selectedFlavors.length === 0) return 0;

    let price = 0;

    if (size.is_broto) {
        // Broto: (price / 2) + 5
        price = (selectedFlavors[0].price / 2) + 5;
    } else {
        // Grande: max of all selected flavors
        price = Math.max(...selectedFlavors.map(f => f.price));
    }

    if (selectedBorder && !size.is_broto) {
        price += selectedBorder.price;
    }

    return price;
}

function formatBRL(value) {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export default function PizzaBuilderModal({ isOpen, onClose, onConfirm, pizzaFlavors = [], pizzaSizes = [], borderOptions = [] }) {
    // Steps: 1 = Size, 2 = Flavors, 3 = Border + Resumo
    const [step, setStep] = useState(1);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedFlavors, setSelectedFlavors] = useState([]);
    const [selectedBorder, setSelectedBorder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [observation, setObservation] = useState('');
    
    // Sub-modals states
    const [customizingFlavor, setCustomizingFlavor] = useState(null);
    const [tempExcluded, setTempExcluded] = useState(new Set());
    const [viewingInfoFlavor, setViewingInfoFlavor] = useState(null);

    // Derived
    const maxFlavors = selectedSize?.max_flavors ?? 0;
    const totalPrice = useMemo(
        () => calculatePizzaPrice(selectedSize, selectedFlavors, selectedBorder),
        [selectedSize, selectedFlavors, selectedBorder]
    );

    const filteredFlavors = useMemo(() => {
        if (!searchTerm.trim()) return pizzaFlavors;
        const t = norm(searchTerm);
        return pizzaFlavors.filter(f => norm(f.name).includes(t));
    }, [pizzaFlavors, searchTerm]);

    const flavorIngredientsToToggle = useMemo(() => {
        if (!customizingFlavor) return [];
        const parsed = (customizingFlavor.ingredients || '')
            .replace(/\([^)]*\)/g, '')
            .split(/,|\se\s/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        const unique = [...new Set(parsed)];
        if (customizingFlavor.flavor_category === 'salgada') {
            const base = ['Molho Artesanal', 'Queijo Mussarela'];
            return [...base, ...unique.filter(i => !base.includes(i))];
        }
        return unique;
    }, [customizingFlavor]);

    // Handlers
    const reset = () => {
        setStep(1);
        setSelectedSize(null);
        setSelectedFlavors([]);
        setSelectedBorder(null);
        setSearchTerm('');
        setObservation('');
        setCustomizingFlavor(null);
        setTempExcluded(new Set());
        setViewingInfoFlavor(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSelectSize = (size) => {
        setSelectedSize(size);
        setSelectedFlavors([]);
        setSelectedBorder(null); // Reset border on size change
        setStep(2);
    };

    const toggleFlavor = (flavor) => {
        // If already selected, remove it
        const exists = selectedFlavors.find(f => f.id === flavor.id);
        if (exists) {
            setSelectedFlavors(prev => prev.filter(f => f.id !== flavor.id));
            return;
        }
        // Otherwise, if not full, open customization sub-modal
        if (selectedFlavors.length >= maxFlavors) return;
        
        setCustomizingFlavor(flavor);
        setTempExcluded(new Set());
    };

    const confirmFlavorCustomization = () => {
        setSelectedFlavors(prev => [...prev, { ...customizingFlavor, excludedIngredients: new Set(tempExcluded) }]);
        setCustomizingFlavor(null);
    };

    const handleConfirm = () => {
        if (!selectedSize || selectedFlavors.length === 0) return;

        const sizeName = selectedSize.is_broto ? 'Broto' : `Grande (35cm)`;
        const fractionLabel = selectedFlavors.length > 1
            ? selectedFlavors.map(f => `1/${selectedFlavors.length} ${f.name}`).join(', ')
            : selectedFlavors[0].name;

        // Build observation with exclusions PER FLAVOR
        let obsParts = [];
        selectedFlavors.forEach(f => {
            if (f.excludedIngredients && f.excludedIngredients.size > 0) {
                obsParts.push(`Exclusões ${f.name}: Sem ${[...f.excludedIngredients].join(', ')}`);
            }
        });
        
        let finalObservation = observation.trim();
        if (obsParts.length > 0) {
            finalObservation = finalObservation ? `${finalObservation}. ${obsParts.join('. ')}` : obsParts.join('. ');
        }

        const pizzaItem = {
            key: `pizza_custom_${Date.now()}`,
            type: 'pizza_custom',
            name: `Pizza ${sizeName}`,
            description: fractionLabel,
            border: (selectedBorder && !selectedSize?.is_broto) ? selectedBorder.name : null,
            price: totalPrice,
            quantity: 1,
            image_url: null,
            category: 'Pizzas',
            observation: finalObservation || null,
            // Backend payload
            size_id: selectedSize.id,
            flavor_ids: selectedFlavors.map(f => f.id),
            border_id: (!selectedSize?.is_broto) ? selectedBorder?.id : null,
        };

        onConfirm(pizzaItem);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-background-dark/80 sm:flex sm:items-center sm:justify-center sm:p-4 sm:backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="w-full h-[100dvh] bg-[#120F1D] flex flex-col overflow-hidden sm:relative sm:w-full sm:max-w-3xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border-subtle sm:shadow-2xl sm:animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">local_pizza</span>
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Montar Pizza</h2>
                            <p className="text-xs text-text-muted">
                                {step === 1 && 'Escolha o tamanho da pizza'}
                                {step === 2 && `Escolha até ${maxFlavors} sabor${maxFlavors > 1 ? 'es' : ''}`}
                                {step === 3 && 'Escolha a borda e confirme'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step Indicators */}
                        <div className="hidden sm:flex items-center gap-1.5 border-r border-border-subtle pr-4 mr-1">
                            {[1, 2, 3].map(s => (
                                <div
                                    key={s}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${s <= step ? 'bg-primary shadow-[0_0_6px_rgba(139,92,246,0.5)]' : 'bg-surface-hover'}`}
                                />
                            ))}
                        </div>
                        <button onClick={handleClose} className="size-9 flex items-center justify-center rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-white border border-border-subtle transition-all">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
                    
                    {/* ─── Step 1: Size Selection ─── */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pizzaSizes.map(size => (
                                <button
                                    key={size.id}
                                    onClick={() => handleSelectSize(size)}
                                    className="group bg-surface border border-border-subtle rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all flex items-center gap-4 sm:flex-col sm:items-start sm:gap-4 active:scale-[0.98]"
                                >
                                    <div className="size-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors flex-shrink-0">
                                        <span className="material-symbols-outlined text-2xl sm:text-3xl">{size.is_broto ? 'circle' : 'panorama_fish_eye'}</span>
                                    </div>
                                    <div className="flex-1 sm:flex-none">
                                        <h3 className="text-base sm:text-lg font-bold text-white mb-1">{size.name}</h3>
                                        <p className="text-sm text-text-muted">
                                            {size.slices} fatias • Até {size.max_flavors} sabor{size.max_flavors > 1 ? 'es' : ''}
                                        </p>
                                    </div>
                                    <div className="hidden sm:block mt-auto pt-3 border-t border-border-subtle w-full text-right">
                                        <span className="text-xs text-primary font-bold uppercase tracking-wider group-hover:tracking-widest transition-all">Selecionar →</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ─── Step 2: Flavor Selection ─── */}
                    {step === 2 && (
                        <div>
                            {/* Actions Header */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setStep(1); setSelectedSize(null); setSelectedFlavors([]); }} className="p-2 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary/30 text-text-muted hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                    </button>
                                    <span className="text-white font-bold text-sm bg-surface px-3 py-2 rounded-xl border border-border-subtle">
                                        {selectedSize?.name} <span className="text-text-muted/50 mx-1">|</span> <span className="text-primary">{selectedFlavors.length}/{maxFlavors}</span>
                                    </span>
                                </div>
                                {/* Search */}
                                <div className="relative w-full sm:w-auto flex-1 max-w-[280px]">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar sabor..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted/50 focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Selected Flavors Chips */}
                            {selectedFlavors.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {selectedFlavors.map(f => (
                                        <span key={f.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/20 text-sm font-bold shadow-sm">
                                            <span className="text-primary/70">{selectedFlavors.length > 1 ? `1/${selectedFlavors.length}` : 'Inteira'}</span> {f.name}
                                            {f.excludedIngredients && f.excludedIngredients.size > 0 && (
                                                <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded ml-1" title="Restrições aplicadas">
                                                    !
                                                </span>
                                            )}
                                            <button onClick={() => toggleFlavor(f)} className="text-primary/60 hover:text-primary ml-1"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Flavor Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredFlavors.map(flavor => {
                                    const isSelected = selectedFlavors.some(f => f.id === flavor.id);
                                    const isFull = selectedFlavors.length >= maxFlavors && !isSelected;

                                    return (
                                        <button
                                            key={flavor.id}
                                            onClick={() => !isFull && toggleFlavor(flavor)}
                                            disabled={isFull}
                                            className={`relative bg-surface border rounded-2xl p-4 text-left transition-all ${isSelected
                                                ? 'border-primary shadow-[0_0_15px_rgba(139,92,246,0.15)] bg-primary/5'
                                                : isFull
                                                    ? 'border-border-subtle opacity-40 cursor-not-allowed'
                                                    : 'border-border-subtle hover:border-primary/30 hover:bg-surface-hover cursor-pointer'
                                                }`}
                                        >
                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); setViewingInfoFlavor(flavor); }} 
                                                    className="size-7 rounded-full bg-white/5 border border-white/5 text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-all shadow-sm"
                                                    title="Ver Ingredientes"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="size-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                                                        <span className="material-symbols-outlined text-[16px] text-white">check</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-white font-semibold text-sm truncate pr-14 leading-relaxed mb-0.5">{flavor.name}</h4>
                                            <p className="text-emerald-400 font-bold text-[13px] mt-1 font-mono">{formatBRL(flavor.price)}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Step 3: Border + Confirmation ─── */}
                    {step === 3 && (
                        <div>
                            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover border border-border-subtle rounded-xl text-text-muted hover:text-white mb-6 transition-all w-fit">
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                <span className="text-sm font-bold">Voltar aos Sabores</span>
                            </button>

                            {/* Order Summary */}
                            <div className="bg-gradient-to-br from-surface to-background-dark rounded-2xl border border-border-subtle p-5 sm:p-6 mb-6">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">Resumo da Pizza</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-muted font-medium text-sm">Tamanho</span>
                                        <span className="text-white font-bold">{selectedSize?.name} <span className="text-text-muted/60 font-normal">({selectedSize?.slices} fatias)</span></span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-text-muted font-medium text-sm mt-0.5">Sabores</span>
                                        <div className="text-right max-w-[70%] flex flex-col gap-2">
                                            {selectedFlavors.map((f, i) => (
                                                <div key={f.id} className="flex flex-col items-end">
                                                    <span className="text-white font-bold">
                                                        {selectedFlavors.length > 1 && <span className="text-primary font-mono text-sm mr-1">1/{selectedFlavors.length}</span>}
                                                        {f.name}
                                                    </span>
                                                    {f.excludedIngredients && f.excludedIngredients.size > 0 && (
                                                        <span className="text-red-400 font-semibold text-xs bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20 mt-1">
                                                            - Sem {[...f.excludedIngredients].join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border-subtle text-xs text-text-muted font-mono bg-black/20 p-2 rounded-lg break-words">
                                        {selectedSize?.is_broto
                                            ? `Regra Broto: (Maior Sabor / 2) + R$ 5,00`
                                            : `Regra Grande: Valor baseia-se no sabor mais caro`
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Border Selection */}
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Borda Recheada <span className="font-normal normal-case">(Opcional)</span></h3>

                            {selectedSize?.is_broto ? (
                                <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 text-sm flex items-start gap-3">
                                    <span className="material-symbols-outlined mt-0.5">info</span>
                                    <p className="font-medium leading-relaxed">Bordas recheadas não estão disponíveis para o tamanho Broto.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedBorder(null)}
                                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${!selectedBorder
                                            ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                            : 'border-border-subtle bg-surface hover:border-primary/30 hover:bg-surface-hover'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${!selectedBorder ? 'border-primary' : 'border-text-muted/50'}`}>
                                                {!selectedBorder && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">Sem Borda</p>
                                                <p className="text-[11px] text-text-muted mt-0.5">Assamento tradicional</p>
                                            </div>
                                        </div>
                                    </button>

                                    {borderOptions.map(border => (
                                        <button
                                            key={border.id}
                                            onClick={() => setSelectedBorder(border)}
                                            className={`p-4 rounded-2xl border text-left transition-all ${selectedBorder?.id === border.id
                                                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                                                : 'border-border-subtle bg-surface hover:border-primary/30 hover:bg-surface-hover'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBorder?.id === border.id ? 'border-primary' : 'border-text-muted/50'}`}>
                                                    {selectedBorder?.id === border.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{border.name}</p>
                                                    <p className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">+ {formatBRL(border.price)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Observation Field */}
                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Observações Gerais <span className="font-normal normal-case">(Opcional)</span></h3>
                                <textarea
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                    placeholder="Ex: Ponto da massa, cortar diferente..."
                                    rows={2}
                                    className="w-full bg-surface border border-border-subtle rounded-2xl px-4 py-3 text-white text-sm placeholder:text-text-muted/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-none shadow-inner"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with price and actions */}
                <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface shrink-0 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Total da pizza</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">{formatBRL(totalPrice)}</p>
                    </div>
                    <div className="flex gap-3">
                        {step === 2 && selectedFlavors.length > 0 && (
                            <button
                                onClick={() => setStep(3)}
                                className="px-6 py-3 rounded-xl bg-primary hover:bg-[#0891b2] text-white font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all flex items-center gap-2"
                            >
                                Avançar
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                onClick={handleConfirm}
                                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-[#0891b2] text-white font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                Adicionar
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Customization Sub-Modal (Step 2.5) ─── */}
                {customizingFlavor && (
                    <div className="absolute inset-0 z-50 bg-[#120F1D] flex flex-col animate-slide-in-right">
                        <div className="w-full h-44 bg-surface-hover flex items-center justify-center relative shrink-0">
                            <span className="material-symbols-outlined text-4xl text-white/5">image</span>
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#120F1D] to-transparent"></div>
                            <button onClick={() => setCustomizingFlavor(null)} className="absolute top-4 right-4 size-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white transition-colors border border-white/10">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                            <h3 className="text-xl font-bold text-white mb-5 leading-tight">{customizingFlavor.name}</h3>
                            {flavorIngredientsToToggle.length > 0 ? (
                                <div>
                                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                                        Personalizar Ingredientes <span className="text-primary normal-case ml-1 font-semibold block sm:inline mt-1 sm:mt-0">(Toque para remover)</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {flavorIngredientsToToggle.map((ing, idx) => {
                                            const isExcluded = tempExcluded.has(ing);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        const next = new Set(tempExcluded);
                                                        if (next.has(ing)) next.delete(ing); else next.add(ing);
                                                        setTempExcluded(next);
                                                    }}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center gap-1.5 ${
                                                        isExcluded
                                                            ? 'bg-red-500/10 border-red-500/30 text-red-400 line-through opacity-70 hover:opacity-100'
                                                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                                    }`}
                                                >
                                                    {isExcluded ? (
                                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                                    )}
                                                    {ing}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {tempExcluded.size > 0 && (
                                        <div className="mt-5 p-3 rounded-xl bg-red-400/10 border border-red-400/20 flex items-start gap-2 text-red-400">
                                            <span className="material-symbols-outlined text-[18px]">info</span>
                                            <p className="text-xs font-bold leading-relaxed">Atenção: A cozinha removerá {tempExcluded.size} ingrediente(s) desta parte da pizza.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted bg-surface p-4 rounded-xl border border-border-subtle">Este sabor não possui lista de ingredientes para personalizar.</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-border-subtle bg-surface shrink-0">
                            <button onClick={confirmFlavorCustomization} className="w-full py-4 bg-primary hover:bg-[#0891b2] text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                Confirmar Sabor
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Info Modal (read-only) ─── */}
                {viewingInfoFlavor && (
                    <div className="absolute inset-0 z-[60] bg-background-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingInfoFlavor(null)}>
                        <div className="bg-surface border border-border-subtle rounded-3xl p-6 w-full max-w-[320px] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-bold text-white leading-tight pr-4">{viewingInfoFlavor.name}</h3>
                                <button onClick={() => setViewingInfoFlavor(null)} className="size-8 rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                            <div className="bg-background-dark p-4 rounded-2xl border border-border-subtle">
                                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Composição</p>
                                <p className="text-sm text-white/80 leading-relaxed">
                                    {viewingInfoFlavor.ingredients || 'Nenhum ingrediente base listado.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
