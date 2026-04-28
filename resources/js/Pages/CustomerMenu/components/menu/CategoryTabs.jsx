import React from 'react';

export default function CategoryTabs({ catalogCategories, activeCategory, setActiveCategory, scrolled, t }) {
    return (
        <div className={`sticky z-40 transition-all duration-300 bg-[#0D0D12]/95 backdrop-blur-md border-b border-white/5 py-3 shadow-lg ${scrolled ? 'top-[72px]' : 'top-0'}`}>
            <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar items-center">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all border-2 ${activeCategory === 'all'
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                >
                    {t('digital_menu.catalog.all')?.toUpperCase()}
                </button>
                {catalogCategories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all border-2 ${activeCategory === category.id
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        {category.name.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}
