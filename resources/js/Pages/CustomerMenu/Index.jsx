import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';
import BottomNav from './components/navigation/BottomNav';
import PizzaBuilderModal from './components/menu/PizzaBuilderModal';
import FlavorDetailModal from './components/menu/FlavorDetailModal';
import LanguageSwitcher from './components/shared/LanguageSwitcher';
import { luccheseMenuTheme } from './theme/luccheseMenuTheme';
import styles from './CustomerMenu.module.css';

function translateCategoryName(name, t) {
    if (!name) return '';
    const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
    const translated = t(`digital_menu.catalog.categories.${normalized}`);
    return translated === `digital_menu.catalog.categories.${normalized}` ? name : translated;
}



function injectBaseIngredients(ingredients, flavorCategory, name) {
    const cat = (flavorCategory || '').toLowerCase();
    const isSavory = !cat || ['salgada', 'tradicional', 'especial'].includes(cat);
    const isForceSweet = (name || '').toLowerCase().includes('doce') || (name || '').toLowerCase().includes('chocolate');

    if (isSavory && !isForceSweet) {
        const base = "Molho artesanal, Queijo mussarela ralado";
        if (!ingredients) return base;
        if (ingredients.toLowerCase().includes('molho artesanal')) return ingredients;
        return `${base}, ${ingredients}`;
    }
    return ingredients;
}

function groupProductsByCategory(products, uncategorizedLabel, t, translateDynamic) {
    const grouped = (products ?? []).reduce((accumulator, product) => {
        const categoryName = product.category || uncategorizedLabel;
        if (!accumulator[categoryName]) accumulator[categoryName] = [];

        // Translate product fields
        const translatedProduct = {
            ...product,
            name: translateDynamic(product.name),
            description: translateDynamic(product.description),
            ingredients: translateDynamic(product.ingredients),
            price: parseFloat(product.price || 0)
        };

        accumulator[categoryName].push(translatedProduct);
        return accumulator;
    }, {});

    return Object.entries(grouped).map(([name, items], index) => ({
        id: name + '-' + index,
        name: translateCategoryName(name, t),
        products: items,
    }));
}

export default function CustomerMenu() {
    const { t, formatCurrency, translateDynamic } = useI18n();
    const { catalogEndpoint, storeSetting, lastOrder } = usePage().props;
    const { data, error, isLoading, refetch } = useDigitalMenuQuery();

    // UI State
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [identity, setIdentity] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isPizzaBuilderOpen, setIsPizzaBuilderOpen] = useState(false);
    const [flavorDetailProduct, setFlavorDetailProduct] = useState(null);
    const [preSelectedPizzaInstance, setPreSelectedPizzaInstance] = useState(null);

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
        if (!data) return [];

        // 1. Group standard products by their category (DB-provided names)
        const baseCategories = groupProductsByCategory(data.products, t('digital_menu.catalog.uncategorized'), t, translateDynamic);

        // 2. Group pizza flavors by their flavor_category (tradicional, especial, doce)
        const flavors = data.pizza_flavors ?? [];
        const pizzaFlavorsGrouped = flavors.reduce((acc, flavor) => {
            let cat = (flavor.flavor_category || '').toLowerCase();
            const price = parseFloat(flavor.base_price || 0);

            // Force separate categories based on price if 'salgada' or missing
            if (!cat || cat === 'salgada') {
                if (price >= 70 && price <= 85) cat = 'tradicional';
                else if (price >= 90 && price <= 105) cat = 'especial';
                else if (flavor.name.toLowerCase().includes('doce') || flavor.name.toLowerCase().includes('chocolate')) cat = 'doce';
                else cat = 'tradicional'; // Fallback
            }

            if (!acc[cat]) acc[acc[cat] ? cat : cat] = []; // Ensure category exists
            if (!acc[cat]) acc[cat] = [];

            acc[cat].push({
                ...flavor,
                name: translateDynamic(flavor.name),
                description: translateDynamic(injectBaseIngredients(flavor.description || flavor.ingredients, flavor.flavor_category, flavor.name)),
                ingredients: translateDynamic(injectBaseIngredients(flavor.ingredients, flavor.flavor_category, flavor.name)),
                price: price, // Normalize base_price to price for consistent UI rendering
                type: 'pizza_flavor'
            });
            return acc;
        }, {});

        // 3. Define display order and create localized virtual categories for pizzas
        const order = ['tradicional', 'especial', 'doce', 'salgada'];
        const pizzaCategories = Object.entries(pizzaFlavorsGrouped)
            .sort(([a], [b]) => {
                const idxA = order.indexOf(a);
                const idxB = order.indexOf(b);
                return (idxA > -1 ? idxA : 99) - (idxB > -1 ? idxB : 99);
            })
            .map(([cat, items]) => {
                const key = `digital_menu.pizza_categories.${cat}`;
                let name = t(key);
                if (name === key) name = cat.charAt(0).toUpperCase() + cat.slice(1);

                return {
                    id: `pizza-${cat}`,
                    name: name,
                    products: items,
                    isPizzaFlavorGroup: true
                };
            });

        return [...pizzaCategories, ...baseCategories];
    }, [data, t]);

    const featuredProducts = useMemo(() => {
        return [...(data?.products ?? [])]
            .filter(p => !p.category?.toLowerCase().includes('extra'))
            .slice(0, 4)
            .map(p => ({
                ...p,
                name: translateDynamic(p.name),
                description: translateDynamic(p.description),
                price: parseFloat(p.price || 0)
            }));
    }, [data?.products, t]);

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
        return `${today.open} – ${today.close}`;
    }, [storeSetting?.opening_hours]);

    const dynamicHoursSummary = useMemo(() => {
        const hours = storeSetting?.opening_hours;
        if (!hours) return null;

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const shortDays = {
            monday: t('digital_menu.days.mon'),
            tuesday: t('digital_menu.days.tue'),
            wednesday: t('digital_menu.days.wed'),
            thursday: t('digital_menu.days.thu'),
            friday: t('digital_menu.days.fri'),
            saturday: t('digital_menu.days.sat'),
            sunday: t('digital_menu.days.sun')
        };

        const todayKey = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
        const today = hours[todayKey];

        if (!today || today.closed) return t('digital_menu.home.closed_today');

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

        const rangeSeparator = t('common.to_range');
        const range = start === end ? shortDays[days[start]] : `${shortDays[days[start]]}${rangeSeparator}${shortDays[days[end]]}`;
        return `${range} ${today.open} – ${today.close}`;
    }, [storeSetting?.opening_hours]);

    const repeatLastOrder = () => {
        if (!lastOrder || !lastOrder.items) return;
        lastOrder.items.forEach(item => {
            addItem({
                id: item.id || `historical-${Math.random()}`,
                name: translateDynamic(item.name),
                price: parseFloat(item.price || 0),
                type: 'product'
            }, item.quantity);
        });
    };

    return (
        <main className="min-h-screen bg-[#0D0D12] text-slate-100 pb-24 font-sans overflow-x-clip">
            {/* Force fixes for flicker and z-index */}
            <style dangerouslySetInnerHTML={{
                __html: `
                header { will-change: height, padding, background-color; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Expanded Header - Scrolls with content */}
            <header className="relative h-auto bg-[#0D0D12] px-6 pt-12 pb-8 flex flex-col items-center text-center gap-6 border-b border-white/5">
                <div className="flex flex-col items-center gap-6 w-full">
                    {/* Logo Section */}
                    <div className="relative rounded-[1.2rem] border-2 border-white/10 bg-white shadow-2xl overflow-hidden shrink-0 w-24 h-24">
                        {storeSetting?.logo_url ? (
                            <img src={storeSetting.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-4xl">restaurant</span>
                            </div>
                        )}
                    </div>

                    {/* Title & Status */}
                    <div className="w-full">
                        <h1 className="font-black text-white uppercase tracking-tight italic text-[1.75rem] leading-tight mb-2">
                            {storeSetting?.store_name || t('digital_menu.store.default_name')}
                        </h1>
                        <div className="flex items-center justify-center text-slate-400 text-sm">
                            <div className="flex items-center gap-2">
                                {storeSetting?.is_open ? (
                                    <div className="flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 text-[10px]">
                                        <span className="rounded-full bg-emerald-400 animate-pulse h-1.5 w-1.5"></span>
                                        {t('digital_menu.status.open')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-full font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 text-[10px]">
                                        <span className="rounded-full bg-red-500 animate-pulse h-1.5 w-1.5"></span>
                                        {t('digital_menu.status.closed')}
                                    </div>
                                )}
                                <span className="opacity-30">•</span>
                                <span className="font-bold text-white/60">
                                    {dynamicHoursSummary || t('digital_menu.home.hours_not_available')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full pt-2">
                        <p className="text-sm font-bold text-white/40 max-w-[240px] mx-auto leading-relaxed">
                            {t('digital_menu.header.subtitle')}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link
                                href="/menu/store-profile"
                                className="flex items-center justify-center transition-all group active:scale-95 shadow-xl px-8 py-3.5 rounded-full bg-white/[0.03] border border-white/10 text-white"
                            >
                                <span className="material-symbols-outlined text-primary text-lg">info</span>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] ml-3">{t('digital_menu.store.profile')}</span>
                            </Link>
                            <LanguageSwitcher scrolled={false} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Compact Header - Pops in on scroll */}
            <div
                className={`fixed top-0 left-0 right-0 z-[100] h-[72px] bg-[#0D0D12]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl flex items-center px-4 transition-all duration-300 transform 
                ${scrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
            >
                <div className="flex items-center w-full">
                    <div className="relative rounded-xl border border-white/10 bg-white overflow-hidden shrink-0 w-10 h-10">
                        {storeSetting?.logo_url ? (
                            <img src={storeSetting.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-lg">restaurant</span>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                        <h1 className="font-black text-white uppercase tracking-tight italic text-sm truncate">
                            {storeSetting?.store_name}
                        </h1>
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase">
                            {storeSetting?.is_open ? (
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                    {t('digital_menu.status.open')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-red-500">
                                    <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse"></span>
                                    {t('digital_menu.status.closed')}
                                </div>
                            )}
                            <span className="opacity-30 text-white">•</span>
                            <span className="text-white/50">{todayHours}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/menu/store-profile"
                            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary text-xl">info</span>
                        </Link>
                        <LanguageSwitcher scrolled={true} />
                    </div>
                </div>
            </div>


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

            {/* Fixed min-height to ensure scrolling is always possible, preventing header flickering */}
            <div className="px-4 mt-6 space-y-10" style={{ minHeight: '110vh' }}>
                {/* Order Again Section */}
                {lastOrder && activeCategory === 'all' && (
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
                                        onClick={repeatLastOrder}
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
                {featuredProducts.length > 0 && activeCategory === 'all' && (
                    <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <h2 className="text-lg font-black text-white mb-4">{t('digital_menu.home.most_ordered')}</h2>
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

                {/* Catalog List */}
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
                                        onClick={() => setIsPizzaBuilderOpen(true)}
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
                                                setFlavorDetailProduct(product);
                                            } else {
                                                addItem(product, 1);
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
                                <span className="text-sm font-bold tracking-wide">{t('digital_menu.cart.open_cart')?.toUpperCase()}</span>
                            </div>
                            <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                        </Link>
                    </div>
                )
            }

            {/* Modals and Nav */}
            <PizzaBuilderModal
                isOpen={isPizzaBuilderOpen}
                onClose={() => {
                    setIsPizzaBuilderOpen(false);
                    setPreSelectedPizzaInstance(null);
                }}
                pizzaSizeOptions={(data?.pizza_sizes ?? []).map(s => ({ ...s, name: translateDynamic(s.name) }))}
                pizzaBorderOptions={(data?.products ?? []).filter(p => String(p.category || '').toLowerCase().includes('extra')).map(p => ({ ...p, name: translateDynamic(p.name) }))}
                pizzaFlavorProducts={(data?.pizza_flavors ?? []).map(f => ({
                    ...f,
                    name: translateDynamic(f.name),
                    description: translateDynamic(injectBaseIngredients(f.description || f.ingredients, f.flavor_category, f.name)),
                    ingredients: translateDynamic(injectBaseIngredients(f.ingredients, f.flavor_category, f.name))
                }))}
                preSelectedInstance={preSelectedPizzaInstance}
            />

            <FlavorDetailModal
                isOpen={!!flavorDetailProduct}
                onClose={() => setFlavorDetailProduct(null)}
                product={flavorDetailProduct}
                onAddFlavor={(p, removedIngredients) => {
                    setPreSelectedPizzaInstance({ flavorId: p.id, removed: removedIngredients });
                    setFlavorDetailProduct(null);
                    setIsPizzaBuilderOpen(true);
                }}
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
