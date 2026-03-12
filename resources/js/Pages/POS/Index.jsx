import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { norm } from '@/utils/normalize';
import PizzaBuilderModal from './PizzaBuilderModal';
import PaymentModal from './PaymentModal';

export default function Index({ products = [], pizzaFlavors = [], pizzaSizes = [], categories = [], cashRegister = null, borderOptions = [] }) {
    const { flash } = usePage().props;

    // ── State ──
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Pizzas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [processing, setProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(flash?.success || null);
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);

    // ── Catalog: merge products + pizza flavors into one list ──
    const allItems = useMemo(() => {
        return [...pizzaFlavors, ...products];
    }, [products, pizzaFlavors]);

    // ── Filtered catalog ──
    const filteredItems = useMemo(() => {
        let items = allItems;

        if (selectedCategory !== 'all') {
            items = items.filter(item => item.category === selectedCategory);
        }

        if (searchTerm.trim()) {
            const term = norm(searchTerm);
            items = items.filter(item => norm(item.name).includes(term));
        }

        return items;
    }, [allItems, selectedCategory, searchTerm]);

    // ── Cart operations ──
    const addToCart = (item) => {
        setCart(prev => {
            const key = `${item.type}_${item.id}`;
            const existing = prev.find(c => c.key === key);

            if (existing) {
                return prev.map(c =>
                    c.key === key ? { ...c, quantity: c.quantity + 1 } : c
                );
            }

            return [...prev, {
                key,
                id: item.id,
                type: item.type,
                name: item.name,
                price: item.price,
                quantity: 1,
                image_url: item.image_url,
                category: item.category,
            }];
        });
    };

    const addPizzaToCart = (pizzaItem) => {
        setCart(prev => [...prev, pizzaItem]);
    };

    const handleItemClick = (item) => {
        if (item.type === 'pizza_flavor') {
            setShowPizzaBuilder(true);
        } else {
            addToCart(item);
        }
    };

    const updateQuantity = (key, delta) => {
        setCart(prev => {
            return prev
                .map(item => item.key === key ? { ...item, quantity: item.quantity + delta } : item)
                .filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (key) => {
        setCart(prev => prev.filter(item => item.key !== key));
    };

    const clearCart = () => setCart([]);

    // ── Totals ──
    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const total = subtotal;

    // ── Format currency ──
    const formatBRL = (value) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    // ── Submit order ──
    const handleOpenPayment = () => {
        if (cart.length === 0 || processing) return;
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = (payments, customerName, customerPhone) => {
        setShowPaymentModal(false);
        setProcessing(true);

        router.post('/pos/order', {
            items: cart.map(item => {
                if (item.type === 'pizza_custom') {
                    return {
                        type: 'pizza_custom',
                        quantity: item.quantity,
                        price: item.price,
                        size_id: item.size_id,
                        flavor_ids: item.flavor_ids,
                        border_id: item.border_id,
                        observation: item.observation || null,
                    };
                }
                return {
                    id: item.id,
                    type: item.type,
                    quantity: item.quantity,
                    price: item.price,
                };
            }),
            customer_name: customerName,
            customer_phone: customerPhone,
            payments,
        }, {
            onSuccess: () => {
                setCart([]);
                setProcessing(false);
                setShowSuccess('Venda finalizada com sucesso!');
                setTimeout(() => setShowSuccess(null), 4000);
            },
            onError: () => {
                setProcessing(false);
            },
            preserveScroll: true,
        });
    };

    const getImageSrc = (item) => {
        if (item.image_url) return item.image_url;
        if (item.type === 'pizza_flavor' || item.type === 'pizza_custom') {
            return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvfLHZJRt6Q6SsDDN_n9CVWpe6gtId25goqKpVoKhtGREzaMVWf4BpO-_CJ8UaR0lHUsN5kvSE9RceHQ4tTi7X5_GhsLQatLFfqIRMTzLQ6vRWIQ33qUgWqR2AvFGOtHmssKyViyDSEh8Gi5BLNgTL0al77fo7BcFsIQaczF-7LR5BruYqhAwDPpd7TSYdhYOwVpRMeRubUOz2E42WQtr92NOD3xLgFsabpM3vmYNVnM18USlQvtIc85h-hFjILkH0iiExC7wovw';
        }
        return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXPOUGMNqr5RObsiOlVQN0mjaApDCRpCh_Grcb7YSY2OY_MTzZsNp4bxP3g7cvGWFGB-QpBs1H8HlxhwTFuYhy_K7MZ7bd20jCqKsof5eC9FMiZPE4F-4QUXuo1Jt7121fIzge_lJTaY8oIHiykX0-oDCGxct2kFMVG1hrrkmNE7xwB9ncQsyjNz6DqnDQgz4VcWFhhGsn6eEusFxRq6evmAcY3C-1WqdmGfhT1OlB9Q4pHFRjr6td_iWUqI2c6HPhQLBhGkxgKQ';
    };

    const getCartImageSrc = (item) => {
        if (item.image_url) return item.image_url;
        return getImageSrc(item);
    };

    // ── POS Top Bar ──
    const posTopBar = (
        <header className="h-20 flex items-center justify-between px-8 border-b border-border-subtle bg-[#111118]/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Status</span>
                    <div className="flex items-center gap-2">
                        {cashRegister ? (
                            <>
                                <div className="w-2 h-2 rounded-full bg-emerald-soft animate-pulse"></div>
                                <span className="text-emerald-soft font-semibold text-sm">Caixa Aberto</span>
                            </>
                        ) : (
                            <>
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span className="text-red-400 font-semibold text-sm">Caixa Fechado</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="h-8 w-[1px] bg-border-subtle mx-2"></div>
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-xs text-text-muted font-medium">Saldo Inicial</p>
                        <p className="text-white font-bold font-mono">{formatBRL(cashRegister?.opening_balance ?? 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted font-medium">Vendas</p>
                        <p className="text-white font-bold font-mono">{cashRegister?.order_count ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted font-medium">Gaveta</p>
                        <p className="text-white font-bold font-mono text-emerald-soft">{formatBRL(cashRegister?.total_in_drawer ?? 0)}</p>
                    </div>
                </div>
            </div>
            <a href="/cash-register" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold transition-all">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Fechar Caixa
            </a>
        </header>
    );

    return (
        <AppLayout topBar={posTopBar}>
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-soft px-6 py-4 rounded-xl backdrop-blur-lg shadow-2xl animate-pulse">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-semibold text-sm">{showSuccess}</span>
                </div>
            )}

            {/* Content Grid */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Cash Register Closed Overlay */}
                {!cashRegister && (
                    <div className="absolute inset-0 z-40 bg-background-dark/80 backdrop-blur-md flex items-center justify-center">
                        <div className="bg-surface border border-border-subtle rounded-2xl p-10 max-w-md w-full text-center flex flex-col items-center gap-4 shadow-2xl">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-2">
                                <span className="material-symbols-outlined text-4xl">lock</span>
                            </div>
                            <h2 className="text-3xl font-black text-white">Caixa Fechado</h2>
                            <p className="text-sm text-text-muted mt-2">Você precisa abrir o caixa para iniciar as vendas e acessar o PDV.</p>
                            <a href="/cash-register" className="mt-6 w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">key</span>
                                Abrir Caixa Agora
                            </a>
                        </div>
                    </div>
                )}

                {/* Product Catalog (Left 65%) */}
                <div className={`flex-[0.65] flex flex-col border-r border-border-subtle overflow-hidden ${!cashRegister ? 'pointer-events-none opacity-50' : ''}`}>
                    {/* Tabs & Search */}
                    <div className="p-6 pb-0 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Catálogo</h2>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                                <input
                                    className="bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all"
                                    placeholder="Buscar item..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-6 border-b border-border-subtle overflow-x-auto">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`pb-4 px-2 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${selectedCategory === 'all'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-muted hover:text-white'
                                    }`}
                            >
                                Todos
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`pb-4 px-2 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${selectedCategory === cat
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-text-muted hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-24" style={{ alignContent: 'start' }}>
                        {filteredItems.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-muted">
                                <span className="material-symbols-outlined text-4xl mb-3">search_off</span>
                                <p className="font-semibold">Nenhum item encontrado</p>
                                <p className="text-sm mt-1">Tente outro termo ou categoria</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <div
                                    key={`${item.type}_${item.id ?? item.key}`}
                                    onClick={() => handleItemClick(item)}
                                    className="group bg-surface hover:bg-surface-hover border border-border-subtle rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 flex flex-col gap-3"
                                >
                                    <div className="relative h-40 w-full rounded-xl overflow-hidden bg-[#1E1E24]">
                                        <img
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            src={getImageSrc(item)}
                                        />
                                        {item.type === 'pizza_flavor' && (
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white">
                                                Personalizar
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-white text-lg leading-tight">{item.name}</h3>
                                        </div>
                                        <p className="text-sm text-text-muted">{item.category}</p>
                                        <div className="mt-auto pt-2 flex items-center justify-between">
                                            <span className="text-emerald-soft font-bold text-lg">{formatBRL(item.price)}</span>
                                            <button className="w-8 h-8 rounded-full bg-surface-hover text-white flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cart Section (Right 35%) */}
                <div className="flex-[0.35] flex flex-col bg-[#111118] border-l border-border-subtle min-w-[320px]">
                    {/* Cart Header */}
                    <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">shopping_cart</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Carrinho</h2>
                                <p className="text-xs text-text-muted">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
                            </div>
                        </div>
                        <button
                            onClick={clearCart}
                            className="text-text-muted hover:text-red-400 transition-colors"
                            title="Limpar carrinho"
                        >
                            <span className="material-symbols-outlined">delete_sweep</span>
                        </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col justify-center items-center text-text-muted opacity-50">
                                <span className="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
                                <p>Carrinho vazio</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.key} className="flex gap-3 bg-surface p-3 rounded-xl border border-transparent hover:border-border-subtle transition-all group">
                                    <div className="w-16 h-16 rounded-lg bg-[#2D2D3A] overflow-hidden flex-shrink-0">
                                        <img
                                            alt="Thumb"
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            src={getCartImageSrc(item)}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h4 className="text-sm font-semibold text-white leading-tight">{item.name}</h4>
                                                {item.type === 'pizza_custom' && (
                                                    <div className="mt-1">
                                                        <p className="text-xs text-primary/90 leading-snug break-words whitespace-normal">{item.description}</p>
                                                        {item.border && <p className="text-xs text-amber-400/80 mt-0.5">{item.border}</p>}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-white whitespace-nowrap">{formatBRL(item.price * item.quantity)}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-text-muted">{item.category}</p>
                                            <div className="flex items-center bg-[#0A0A0B] rounded-lg p-1 gap-2 border border-border-subtle">
                                                <button
                                                    onClick={() => updateQuantity(item.key, -1)}
                                                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white rounded hover:bg-surface"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">remove</span>
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.key, 1)}
                                                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white rounded hover:bg-surface"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Footer */}
                    <div className="p-6 border-t border-border-subtle bg-[#111118] space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-text-muted">
                                <span>Subtotal</span>
                                <span>{formatBRL(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-dashed border-border-subtle">
                                <span>Total</span>
                                <span>{formatBRL(total)}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenPayment}
                            disabled={cart.length === 0 || processing || !cashRegister}
                            className={`w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 ${cart.length === 0 || processing || !cashRegister ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {processing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">point_of_sale</span>
                                    Finalizar Venda
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onConfirm={handleConfirmPayment}
                total={total}
            />
            {/* Pizza Builder Modal */}
            <PizzaBuilderModal
                isOpen={showPizzaBuilder}
                onClose={() => setShowPizzaBuilder(false)}
                onConfirm={addPizzaToCart}
                pizzaFlavors={pizzaFlavors}
                pizzaSizes={pizzaSizes}
                borderOptions={borderOptions}
            />
        </AppLayout>
    );
}
