import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';
import BottomNav from './components/navigation/BottomNav';
import PizzaBuilderModal from './components/menu/PizzaBuilderModal';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';
import styles from './CustomerMenu.module.css';

function groupProductsByCategory(products, uncategorizedLabel) {
    const grouped = (products ?? []).reduce((accumulator, product) => {
        const categoryName = product.category || uncategorizedLabel;
        if (!accumulator[categoryName]) accumulator[categoryName] = [];
        accumulator[categoryName].push(product);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([name, items], index) => ({
        id: name + '-' + index,
        name,
        products: items,
    }));
}

export default function CustomerMenu() {
    const { t, formatCurrency } = useI18n();
    const { catalogEndpoint, storeSetting, lastOrder } = usePage().props;
    const { data, error, isLoading, refetch } = useDigitalMenuQuery();

    // UI State
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [identity, setIdentity] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isPizzaBuilderOpen, setIsPizzaBuilderOpen] = useState(false);

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Increased threshold to account for expanded header height
            setScrolled(window.scrollY > 180);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { items, addItem, cartItemCount, cartTotal } = useCart();

    useEffect(() => {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try { setIdentity(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    const catalogCategories = useMemo(() => {
        if (!data?.products) return [];
        return groupProductsByCategory(data.products, t('digital_menu.catalog.uncategorized'));
    }, [data?.products, t]);

    const featuredProducts = useMemo(() => {
        return [...(data?.products ?? [])].filter(p => !p.category?.toLowerCase().includes('extra')).slice(0, 4);
    }, [data?.products]);

    const filteredCategories = useMemo(() => {
        if (activeCategory === 'all') return catalogCategories;
        return catalogCategories.filter(c => c.id === activeCategory);
    }, [catalogCategories, activeCategory]);

    const todayHours = useMemo(() => {
        const hours = storeSetting?.opening_hours;
        if (!hours) return null;
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayKey = dayMap[new Date().getDay()];
        const today = hours[todayKey];
        if (!today || today.closed || !today.open || !today.close) return null;
        return `${today.open} ${t('common.to') || 'às'} ${today.close}`;
    }, [storeSetting?.opening_hours]);

    const dynamicHoursSummary = useMemo(() => {
        const hours = storeSetting?.opening_hours;
        if (!hours) return null;

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const shortDays = {
            monday: t('digital_menu.days.mon') || 'Seg',
            tuesday: t('digital_menu.days.tue') || 'Ter',
            wednesday: t('digital_menu.days.wed') || 'Qua',
            thursday: t('digital_menu.days.thu') || 'Qui',
            friday: t('digital_menu.days.fri') || 'Sex',
            saturday: t('digital_menu.days.sat') || 'Sáb',
            sunday: t('digital_menu.days.sun') || 'Dom'
        };

        // Simplified logic: find current day and its neighbors with same hours
        const todayKey = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // standard JS 0=Sun, but our array is Mon-Sun
        const today = hours[todayKey];

        if (!today || today.closed) return t('digital_menu.home.closed_today') || "Fechado hoje";

        // Logic for summary: find range including today
        let start = days.indexOf(todayKey);
        let end = start;

        // Look back
        while (start > 0 &&
            !hours[days[start - 1]].closed &&
            hours[days[start - 1]].open === today.open &&
            hours[days[start - 1]].close === today.close) {
            start--;
        }

        // Look forward
        while (end < 6 &&
            !hours[days[end + 1]].closed &&
            hours[days[end + 1]].open === today.open &&
            hours[days[end + 1]].close === today.close) {
            end++;
        }

        const rangeSeparator = t('common.to_range') || ' a ';
        const range = start === end ? shortDays[days[start]] : `${shortDays[days[start]]}${rangeSeparator}${shortDays[days[end]]}`;
        return `${range} ${today.open} ${t('common.to') || 'às'} ${today.close}`;
    }, [storeSetting?.opening_hours]);

    const repeatLastOrder = () => {
        if (!lastOrder || !lastOrder.items) return;
        lastOrder.items.forEach(item => {
            // Find the item in our current catalog just to be safe, or just add it directly.
            // For now, add it directly using the details from lastOrder
            addItem({
                id: item.id || `historical-${Math.random()}`,
                name: item.name,
                price: parseFloat(item.price || 0),
                type: 'product'
            }, item.quantity);
        });
    };

    return (
        <main className="min-h-screen bg-[#0D0D12] text-slate-100 pb-24 font-sans select-none overflow-x-clip">
            {/* Force fixes for flicker and z-index */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .sticky { transform: none !important; }
                .z-50 { z-index: 9999 !important; }
                header { will-change: height, padding, background-color; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Unified Smooth Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out border-b border-white/5 
                ${scrolled
                        ? 'h-[72px] bg-[#0D0D12]/95 backdrop-blur-xl shadow-2xl flex items-center px-4 pt-0'
                        : 'relative h-auto bg-[#0D0D12] px-6 pt-12 pb-8 flex flex-col items-center text-center gap-6'}`}
            >
                <div className={`flex items-center transition-all duration-500 ${scrolled ? 'flex-row w-full' : 'flex-col gap-6 w-full'}`}>
                    {/* Logo Section */}
                    <div className={`relative transition-all duration-500 rounded-[1.2rem] border-2 border-white/10 bg-white shadow-2xl overflow-hidden shrink-0 
                        ${scrolled ? 'w-10 h-10' : 'w-24 h-24'}`}>
                        {storeSetting?.logo_url ? (
                            <img src={storeSetting.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className={`material-symbols-outlined text-primary ${scrolled ? 'text-lg' : 'text-4xl'}`}>restaurant</span>
                            </div>
                        )}
                    </div>

                    {/* Title & Status */}
                    <div className={`transition-all duration-500 ${scrolled ? 'ml-4 flex-1 min-w-0 text-left' : 'w-full'}`}>
                        <h1 className={`font-black text-white uppercase tracking-tight italic transition-all duration-500 
                            ${scrolled ? 'text-sm truncate' : 'text-[1.75rem] leading-tight mb-2'}`}>
                            {storeSetting?.store_name || t('digital_menu.home.store_default_name')}
                        </h1>

                        <div className={`flex items-center transition-all duration-300 ${scrolled ? 'text-[8px] text-emerald-400 font-black uppercase' : 'justify-center text-slate-400 text-sm'}`}>
                            <div className="flex items-center gap-2">
                                {storeSetting?.is_open ? (
                                    <div className={`${scrolled ? 'flex items-center gap-1' : 'flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 text-[10px]'}`}>
                                        <span className={`rounded-full bg-emerald-400 animate-pulse ${scrolled ? 'h-1 w-1' : 'h-1.5 w-1.5'}`}></span>
                                        {t('digital_menu.status.open')}
                                    </div>
                                ) : (
                                    <div className={`${scrolled ? 'flex items-center gap-1 text-red-500' : 'flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 text-[10px]'}`}>
                                        <span className={`rounded-full bg-red-500 animate-pulse ${scrolled ? 'h-1 w-1' : 'h-1.5 w-1.5'}`}></span>
                                        {t('digital_menu.status.closed')}
                                    </div>
                                )}
                                <span className="opacity-30">•</span>
                                <span className={scrolled ? 'text-white/50' : 'font-bold text-white/60'}>
                                    {scrolled ? todayHours : (dynamicHoursSummary || t('digital_menu.home.hours_not_available'))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions & Navigation */}
                    <div className={`flex items-center transition-all duration-500 ${scrolled ? 'gap-2' : 'flex-col gap-6 w-full pt-6'}`}>
                        {!scrolled && (
                            <p className="text-sm font-bold text-white/40 max-w-[240px] leading-relaxed animate-in fade-in slide-in-from-top-4 duration-700">
                                {t('digital_menu.header.subtitle')}
                            </p>
                        )}

                        <div className="flex items-center gap-4">
                            <Link
                                href="/menu/store-profile"
                                className={`flex items-center justify-center transition-all group active:scale-95 shadow-xl ${scrolled ? 'p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70' : 'px-8 py-3.5 rounded-full bg-white/[0.03] border border-white/10 text-white'}`}
                            >
                                <span className={`material-symbols-outlined text-primary ${scrolled ? 'text-xl' : 'text-lg'}`}>info</span>
                                {!scrolled && <span className="text-[11px] font-black uppercase tracking-[0.2em] ml-3">{t('digital_menu.store.profile')}</span>}
                            </Link>
                            <LanguageSwitcher scrolled={scrolled} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer to prevent layout shift when header becomes fixed */}
            {scrolled && <div className="h-[72px] w-full" />}

            {/* Category Tabs Scroll */}
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

            <div className="px-4 mt-6 space-y-10">
                {/* Order Again Section */}
                {lastOrder && activeCategory === 'all' && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-lg font-black text-white mb-4">{t('digital_menu.home.order_again') || 'Peça de novo'}</h2>
                        <div className={`${luccheseMenuTheme.glass} rounded-[1.5rem] p-4 border border-white/5`}>
                            <div className="flex items-start gap-4">
                                <div className="w-20 h-20 bg-black/40 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-4xl text-primary opacity-80">history</span>
                                </div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('digital_menu.home.last_order') || 'ÚLTIMO PEDIDO'}</span>
                                    <div className="text-sm font-bold text-white leading-tight line-clamp-2 mb-2">
                                        {lastOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </div>
                                    <button
                                        onClick={repeatLastOrder}
                                        className="text-primary font-bold text-sm hover:text-primary-hover transition-colors"
                                    >
                                        {t('digital_menu.cart.add_item') || 'Adicionar ao carrinho'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Most Ordered */}
                {featuredProducts.length > 0 && activeCategory === 'all' && (
                    <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <h2 className="text-lg font-black text-white mb-4">{t('digital_menu.home.most_ordered') || 'Os mais pedidos'}</h2>
                        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4">
                            {featuredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addItem(product, 1)}
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
                                                {t('digital_menu.home.popular') || 'Popular'}
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

                {/* Catalog List */}
                <div className="space-y-8 pb-10">
                    {filteredCategories.map(category => (
                        <section key={category.id} className="scroll-mt-32" id={category.id}>
                            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-widest">{t(`categories.${category.id}`) || category.name}</h2>
                            {category.name.toLowerCase().includes('pizza') && (
                                <p className="text-sm text-slate-400 mb-5">{t('digital_menu.home.pizza_custom_subtitle') || 'Escolha os tamanhos para montar sua pizza do seu jeito!'}</p>
                            )}

                            <div className="space-y-4 pt-2">
                                {category.name.toLowerCase().includes('pizza') && (
                                    <button
                                        onClick={() => setIsPizzaBuilderOpen(true)}
                                        className="w-full flex items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl p-4 text-left transition-all hover:bg-primary/20 hover:scale-[1.01] active:scale-95 group mb-6"
                                    >
                                        <div className="w-24 h-24 rounded-2xl bg-[#52301c] border-2 border-[#382012] flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                                            <span className="material-symbols-outlined text-4xl text-primary drop-shadow-md relative z-10">pie_chart</span>
                                        </div>
                                        <div className="flex-1 pr-2">
                                            <h3 className="text-base font-black text-white mb-1 leading-tight group-hover:text-primary transition-colors">{t('digital_menu.home.pizza_custom_btn') || 'Monte sua Pizza'}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-2">{t('digital_menu.home.pizza_custom_desc') || 'Escolha o tamanho, sabores e a borda ideal para matar a fome da galera!'}</p>
                                        </div>
                                    </button>
                                )}

                                {category.products.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => addItem(product, 1)}
                                        className={`w-full flex items-start gap-4 ${luccheseMenuTheme.glass} border-white/5 rounded-3xl p-4 text-left transition-all hover:bg-white/10 active:scale-[0.98]`}
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-sm font-bold text-white mb-1 leading-snug">{product.name}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{product.description || t('digital_menu.home.click_to_add') || 'Clique para adicionar.'}</p>
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
            </div>

            {/* Float Cart Button Mobile (if items in cart) */}
            {
                cartItemCount > 0 && (
                    <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
                        <Link href="/menu/checkout" className="w-full bg-primary hover:bg-primary-hover text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-[0_8px_30px_rgba(139,92,246,0.3)] transition-transform active:scale-95">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-black text-sm">
                                    {cartItemCount}
                                </div>
                                <span className="text-sm font-bold tracking-wide">{t('digital_menu.cart.open_cart')?.toUpperCase() || 'VER CARRINHO'}</span>
                            </div>
                            <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                        </Link>
                    </div>
                )
            }

            {/* Modals and Nav */}
            <PizzaBuilderModal
                isOpen={isPizzaBuilderOpen}
                onClose={() => setIsPizzaBuilderOpen(false)}
                pizzaSizeOptions={data?.pizza_sizes ?? []}
                pizzaBorderOptions={(data?.products ?? []).filter(p => String(p.category || '').toLowerCase().includes('extra'))}
                pizzaFlavorProducts={data?.pizza_flavors ?? []}
            />

            <BottomNav onOpenProfile={() => {
                if (identity) setIsProfileModalOpen(true);
                else setIsIdentityModalOpen(true);
            }} />

            <IdentityModal
                isOpen={isIdentityModalOpen}
                onClose={() => setIsIdentityModalOpen(false)}
                onSuccess={(cust) => { setIdentity(cust); setIsIdentityModalOpen(false); }}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSuccess={(cust) => { setIdentity(cust); setIsProfileModalOpen(false); }}
                customer={identity}
            />
        </main>
    );
}
