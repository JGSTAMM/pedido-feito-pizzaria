import React from 'react';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function CatalogList({ filteredCategories, t, formatCurrency, onAddItem, onOpenFlavorDetail, onOpenPizzaBuilder }) {
    return (
        <div className="space-y-8 pb-10">
            {filteredCategories.map(category => (
                <section key={category.id} className="scroll-mt-32" id={category.id}>
                    <h2 className="text-xl font-black text-white mb-1 uppercase tracking-widest">{category.name}</h2>
                    {(category.isPizzaFlavorGroup || category.name.toLowerCase().includes('pizza')) && (
                        <p className="text-sm text-slate-400 mb-5">{t('digital_menu.home.pizza_custom_subtitle')}</p>
                    )}

                    <div className="space-y-4 pt-2">
                        {(category.isPizzaFlavorGroup || category.name.toLowerCase().includes('pizza')) && (
                            <button
                                onClick={onOpenPizzaBuilder}
                                className="w-full flex items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl p-4 text-left transition-all hover:bg-primary/20 hover:scale-[1.01] active:scale-95 group mb-6"
                            >
                                <div className="w-24 h-24 rounded-2xl bg-[#52301c] border-2 border-[#382012] flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                                    <span className="material-symbols-outlined text-4xl text-primary drop-shadow-md relative z-10">pie_chart</span>
                                </div>
                                <div className="flex-1 pr-2">
                                    <h3 className="text-base font-black text-white mb-1 leading-tight group-hover:text-primary transition-colors">{t('digital_menu.home.pizza_custom_btn')}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2">{t('digital_menu.home.pizza_custom_desc')}</p>
                                </div>
                            </button>
                        )}

                        {category.products.map(product => (
                            <button
                                key={product.id}
                                onClick={() => {
                                    if (product.type === 'pizza_flavor' || category.isPizzaFlavorGroup) {
                                        onOpenFlavorDetail(product);
                                    } else {
                                        onAddItem(product, 1);
                                    }
                                }}
                                className={`w-full flex items-start gap-4 ${luccheseMenuTheme.glass} border-white/5 rounded-3xl p-4 text-left transition-all hover:bg-white/10 active:scale-[0.98]`}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <h3 className="text-sm font-bold text-white mb-1 leading-snug">{product.name}</h3>
                                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                        {product.description || product.ingredients || t('digital_menu.home.click_to_add')}
                                    </p>
                                    <p className="text-sm font-black text-primary">{formatCurrency(product.price)}</p>
                                </div>
                                <div className="w-28 h-28 bg-black/40 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-white/20">fastfood</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
