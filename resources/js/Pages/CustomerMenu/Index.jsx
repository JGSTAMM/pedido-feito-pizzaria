import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import useI18n from '@/hooks/useI18n';
import { useCart } from './hooks/useCart';
import { useDigitalMenuQuery } from './hooks/useDigitalMenuQuery';
import { useStoreHours } from './hooks/useStoreHours';
import ProductVariationModal from '@/Pages/POS/ProductVariationModal';
import { buildCatalogCategories, buildFeaturedProducts } from './utils/menuHelpers';

// Layout Components
import MenuHeader from './components/layout/MenuHeader';
import BottomNav from './components/navigation/BottomNav';

// Identity Components
import IdentityModal from './components/identity/IdentityModal';
import ProfileModal from './components/identity/ProfileModal';

// Menu Components
import CategoryTabs from './components/menu/CategoryTabs';
import CatalogList from './components/menu/CatalogList';
import FeaturedSection from './components/menu/FeaturedSection';
import PizzaBuilderModal from './components/menu/PizzaBuilderModal';
import FlavorDetailModal from './components/menu/FlavorDetailModal';

export default function CustomerMenu() {
    const { t, formatCurrency, translateDynamic } = useI18n();
    const { storeSetting, lastOrder } = usePage().props;
    const { data, isLoading } = useDigitalMenuQuery();

    // UI State
    const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [identity, setIdentity] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isPizzaBuilderOpen, setIsPizzaBuilderOpen] = useState(false);
    const [flavorDetailProduct, setFlavorDetailProduct] = useState(null);
    const [variationProduct, setVariationProduct] = useState(null);
    const [preSelectedPizzaInstance, setPreSelectedPizzaInstance] = useState(null);
    const [scrolled, setScrolled] = useState(false);



    const { addItem, cartItemCount, cartTotal } = useCart();
    const { todayHours, dynamicHoursSummary } = useStoreHours(storeSetting?.opening_hours);

    useEffect(() => {
        const stored = localStorage.getItem('customerIdentity');
        if (stored) {
            try { setIdentity(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    const catalogCategories = useMemo(
        () => buildCatalogCategories(data, t, translateDynamic),
        [data, t, translateDynamic]
    );

    const featuredProducts = useMemo(
        () => buildFeaturedProducts(data?.products, translateDynamic),
        [data?.products, translateDynamic]
    );

    const filteredCategories = useMemo(() => {
        if (activeCategory === 'all') return catalogCategories;
        return catalogCategories.filter(c => c.id === activeCategory);
    }, [catalogCategories, activeCategory]);

    const repeatLastOrder = () => {
        if (!lastOrder || !lastOrder.items) return;
        lastOrder.items.forEach(item => {
            addItem({
                id: item.id || `historical-${Math.random()}`,
                name: translateDynamic(item.name),
                price: parseFloat(item.price || 0),
                type: 'product',
                observation: item.notes
            }, item.quantity);
        });
    };

    const handleVariationConfirm = (product, variation, observationText) => {
        let finalNotes = variation.name;
        if (observationText && observationText.trim()) {
            finalNotes = `${finalNotes} | 📝 Obs: ${observationText.trim()}`;
        }
        addItem({
            ...product,
            name: `${product.name} (${variation.name})`,
            price: variation.price,
            observation: finalNotes,
        }, 1);
        setVariationProduct(null);
    };

    return (
        <main
            className="h-[100dvh] overflow-y-auto custom-scrollbar bg-[#0D0D12] text-slate-100 pb-24 font-sans overflow-x-clip"
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 180)}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                header { will-change: height, padding, background-color; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @media (min-width: 768px) {
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(90, 90, 246, 0.4); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #5a5af6; }
                }
            `}} />

            <MenuHeader
                storeSetting={storeSetting}
                t={t}
                todayHours={todayHours}
                dynamicHoursSummary={dynamicHoursSummary}
                scrolled={scrolled}
            />

            <CategoryTabs
                catalogCategories={catalogCategories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                scrolled={scrolled}
                t={t}
            />

            <FeaturedSection
                lastOrder={lastOrder}
                featuredProducts={featuredProducts}
                t={t}
                formatCurrency={formatCurrency}
                onAddItem={(p) => {
                    let variations = p.variations;
                    if (typeof variations === 'string') {
                        try { variations = JSON.parse(variations); } catch { variations = []; }
                    }
                    if (Array.isArray(variations) && variations.length > 0) {
                        setVariationProduct({ ...p, variations });
                    } else {
                        addItem(p, 1);
                    }
                }}
                onRepeatLastOrder={repeatLastOrder}
                activeCategory={activeCategory}
            />

            <div className="px-4 mt-10">
                <CatalogList
                    filteredCategories={filteredCategories}
                    t={t}
                    formatCurrency={formatCurrency}
                    onAddItem={(p) => {
                        // Robust parse: backend may send variations as JSON string
                        let variations = p.variations;
                        if (typeof variations === 'string') {
                            try { variations = JSON.parse(variations); } catch { variations = []; }
                        }
                        if (Array.isArray(variations) && variations.length > 0) {
                            setVariationProduct({ ...p, variations });
                        } else {
                            addItem(p, 1);
                        }
                    }}
                    onOpenFlavorDetail={setFlavorDetailProduct}
                    onOpenPizzaBuilder={() => setIsPizzaBuilderOpen(true)}
                />
            </div>

            {/* Float Cart Button Mobile */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <Link
                        href="/menu/cart"
                        className="w-full bg-primary hover:bg-primary-hover text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-[0_8px_30px_rgba(139,92,246,0.3)] transition-transform active:scale-95"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-black text-sm">
                                {cartItemCount}
                            </div>
                            <span className="text-sm font-bold tracking-wide">{t('digital_menu.cart.open_cart')?.toUpperCase()}</span>
                        </div>
                        <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                    </Link>
                </div>
            )}

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
                    description: translateDynamic(f.description || f.ingredients),
                    ingredients: translateDynamic(f.ingredients)
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

            <ProductVariationModal
                isOpen={!!variationProduct}
                onClose={() => setVariationProduct(null)}
                product={variationProduct}
                onConfirm={handleVariationConfirm}
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
