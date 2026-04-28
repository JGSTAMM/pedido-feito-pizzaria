import React from 'react';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function FeaturedSection({ lastOrder, featuredProducts, t, formatCurrency, onAddItem, onRepeatLastOrder, activeCategory }) {
    if (activeCategory !== 'all') return null;

    return (
        <div className="px-4 mt-6 space-y-10">
            {/* Order Again Section */}
            {lastOrder && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-lg font-black text-white mb-4">{t('digital_menu.home.order_again')}</h2>
                    <div className={`${luccheseMenuTheme.glass} rounded-[1.5rem] p-4 border border-white/5`}>
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 bg-black/40 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10">
                                <span className="material-symbols-outlined text-4xl text-primary opacity-80">history</span>
                            </div>
                            <div className="flex-1">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('digital_menu.home.last_order')}</span>
                                <div className="text-sm font-bold text-white leading-tight line-clamp-2 mb-2">
                                    {lastOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                                <button
                                    onClick={onRepeatLastOrder}
                                    className="text-primary font-bold text-sm hover:text-primary-hover transition-colors"
                                >
                                    {t('digital_menu.cart.add_item')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Most Ordered */}
            {featuredProducts.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <h2 className="text-lg font-black text-white mb-4">{t('digital_menu.home.most_ordered')}</h2>
                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                        {featuredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => onAddItem(product, 1)}
                                className="w-40 flex-shrink-0 text-left group"
                            >
                                <div className="w-full aspect-square bg-white/5 rounded-[1.5rem] border border-white/5 mb-3 overflow-hidden relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-white/10">restaurant_menu</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12]/90 to-transparent"></div>
                                    <div className="absolute bottom-3 left-3">
                                        <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            {t('digital_menu.home.popular')}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                <p className="text-primary font-black">{formatCurrency(product.price)}</p>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
