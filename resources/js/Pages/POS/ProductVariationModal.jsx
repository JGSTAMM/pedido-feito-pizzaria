import { useState, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';

export default function ProductVariationModal({ isOpen, onClose, onConfirm, product }) {
    const { t, formatCurrency } = useI18n();
    const [selectedVariation, setSelectedVariation] = useState(null);

    // Reset selection when product changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedVariation(null);
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    // Safety: backend (Inertia/Laravel) may serialize variations as a JSON string.
    let variations = product.variations;
    if (typeof variations === 'string') {
        try { variations = JSON.parse(variations); } catch { variations = []; }
    }
    if (!Array.isArray(variations)) variations = [];

    const handleConfirm = () => {
        if (!selectedVariation) return;
        onConfirm(product, selectedVariation);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background-dark/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose} 
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-[#120F1D] rounded-3xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-scale-in">
                
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-white/5 flex items-start justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                        {product.image_url && (
                            <img src={product.image_url.startsWith('http') ? product.image_url : `/storage/${product.image_url}`} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10" />
                        )}
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                                {product.category || 'PRODUTO'}
                            </p>
                            <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                                {product.name}
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-10 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all border border-white/5 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Content - Variation List */}
                <div className="p-6 sm:p-8 space-y-3 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 px-1">
                        {t('digital_menu.catalog.select_variation_subtitle') || 'Selecione uma opção'}
                    </p>
                    
                    {variations.length > 0 ? (
                        variations.map((v, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedVariation(v)}
                                className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                                    selectedVariation?.name === v.name
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(139,92,246,0.15)] scale-[1.02]'
                                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                        selectedVariation?.name === v.name 
                                            ? 'border-primary bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]' 
                                            : 'border-white/20 group-hover:border-white/40'
                                    }`}>
                                        {selectedVariation?.name === v.name && (
                                            <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>
                                        )}
                                    </div>
                                    <span className={`text-base font-bold transition-colors ${
                                        selectedVariation?.name === v.name ? 'text-white' : 'text-text-muted group-hover:text-white'
                                    }`}>
                                        {v.name}
                                    </span>
                                </div>
                                <div className="relative z-10 text-right">
                                    <span className={`text-lg font-black font-mono transition-all duration-300 ${
                                        selectedVariation?.name === v.name ? 'text-emerald-400 scale-110' : 'text-text-muted group-hover:text-emerald-400'
                                    }`}>
                                        {formatCurrency(Number(v.price))}
                                    </span>
                                </div>

                                {/* Animated background gradient for active selection */}
                                {selectedVariation?.name === v.name && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50 animate-pulse" />
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="py-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <span className="material-symbols-outlined text-4xl text-text-muted/30 mb-2">inventory_2</span>
                            <p className="text-sm text-text-muted font-medium">Nenhuma variação disponível.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 pt-4 bg-white/[0.02] border-t border-white/5">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedVariation}
                        className={`w-full py-5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 relative overflow-hidden group active:scale-95 ${
                            selectedVariation 
                                ? 'bg-gradient-to-r from-primary to-[#06b6d4] text-white shadow-[0_20px_40px_-12px_rgba(139,92,246,0.4)]' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                    >
                        {selectedVariation && (
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        )}
                        <span className="material-symbols-outlined text-[24px] relative z-10">add_shopping_cart</span>
                        <span className="relative z-10 uppercase tracking-widest">
                            {t('digital_menu.catalog.add_variation_to_order') || 'Adicionar ao Pedido'}
                        </span>
                    </button>
                    
                    {selectedVariation && (
                        <p className="text-center text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-4 animate-fade-in">
                            {formatCurrency(Number(selectedVariation.price))} • Selecionado
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
