import { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import PizzaBuilderModal from '@/Pages/POS/PizzaBuilderModal';
import ReceiptPrint from '@/Components/ReceiptPrint';
import axios from 'axios';

export default function TableOrderDrawer({
    table,
    isOpen,
    onClose,
    products = [],
    pizzaFlavors = [],
    pizzaSizes = [],
    categories = [],
    borderOptions = [],
    isMobile = false,
}) {
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
    const [sending, setSending] = useState(false);
    const [pageError, setPageError] = useState('');

    // Quick Item Modal state
    const [selectedQuickItem, setSelectedQuickItem] = useState(null);
    const [quickObservation, setQuickObservation] = useState('');

    // Checkout Modal state
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('dinheiro');
    const [checkingOut, setCheckingOut] = useState(false);
    const [payments, setPayments] = useState([]);
    const [paymentInputValue, setPaymentInputValue] = useState('');

    // Tabs: 'account' or 'add_items'. Safely check table?.status since it evaluates before early return.
    const [activeTab, setActiveTab] = useState(table?.status === 'occupied' ? 'account' : 'add_items');

    // ── Catalog Filtering ──
    const allItems = useMemo(() => [...products, ...pizzaFlavors], [products, pizzaFlavors]);

    const filteredItems = useMemo(() => {
        let items = allItems;
        if (activeCategory === 'Pizzas') {
            // In Pizzas category, do NOT list individual flavors — show a CTA to open Pizza Builder
            items = [];
        } else if (activeCategory === null && !searchTerm) {
            // "Todos" default tab without search -> Hide individual flavors & SORT strictly
            items = items.filter(i => i.category !== 'Pizzas');
            items.sort((a, b) => {
                const getPriority = (item) => {
                    if (item.category === 'Promoções' || item.category === 'Extras') return 1;
                    if (item.category === 'Bebidas') return 2;
                    return 3;
                };
                return getPriority(a) - getPriority(b);
            });
        } else if (activeCategory) {
            items = items.filter(i => i.category === activeCategory);
        }
        if (searchTerm) {
            const q = norm(searchTerm);
            items = items.filter(i => norm(i.name).includes(q));
        }
        return items;
    }, [allItems, activeCategory, searchTerm]);

    // ── Cart Actions ──

    // Only for non-pizza items when clicked from the list
    const handleQuickItemClick = (item) => {
        setSelectedQuickItem(item);
        setQuickObservation('');
    };

    const confirmQuickItem = () => {
        if (!selectedQuickItem) return;

        setCart(prev => {
            const existing = prev.find(c => c.id === selectedQuickItem.id && c.type === selectedQuickItem.type && c.type !== 'pizza_custom' && c.observation === quickObservation);
            if (existing) {
                return prev.map(c =>
                    c.key === existing.key ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, {
                ...selectedQuickItem,
                quantity: 1,
                observation: quickObservation,
                key: `${selectedQuickItem.type}_${selectedQuickItem.id}_${Date.now()}`
            }];
        });

        setSelectedQuickItem(null);
        setQuickObservation('');
    };

    const removeFromCart = (key) => {
        setCart(prev => prev.filter(c => c.key !== key));
    };

    const updateQty = (key, delta) => {
        setCart(prev =>
            prev.map(c => {
                if (c.key !== key) return c;
                const newQty = c.quantity + delta;
                return newQty < 1 ? c : { ...c, quantity: newQty };
            })
        );
    };

    const handlePizzaConfirm = (pizzaItem) => {
        setCart(prev => [...prev, pizzaItem]);
        setShowPizzaBuilder(false);
    };

    const cartTotal = cart.reduce((sum, c) => sum + (c.price * c.quantity), 0);

    // ── Send to Kitchen ──
    const handleSend = () => {
        if (cart.length === 0 || sending) return;
        setSending(true);

        const payload = {
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
        };

        router.post(`/floor/${table.id}/add-items`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setSending(false);
                setPageError('');
                onClose();
            },
            onError: (errors) => {
                setSending(false);
                if (errors && errors.error) {
                    setPageError(errors.error);
                }
            },
        });
    };

    const handleCheckout = async () => {
        if (!table?.active_order || payments.length === 0) return;
        setCheckingOut(true);

        router.post(`/floor/${table.id}/pay`, {
            payments: payments.map(p => ({ method: p.method, amount: p.amount }))
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCheckoutModal(false);
                setPayments([]);
                setCheckingOut(false);
                onClose();
            },
            onError: () => {
                setCheckingOut(false);
            }
        });
    };

    // ── Reset on close ──
    const handleClose = () => {
        setCart([]);
        setSearchTerm('');
        setActiveCategory(null);
        setShowPizzaBuilder(false);
        setPayments([]);
        setPaymentInputValue('');
        setPageError('');
        // Reset tab based on table status when reopening
        setActiveTab(table?.status === 'occupied' ? 'account' : 'add_items');
        onClose();
    };

    if (!isOpen || !table) return null;

    const isOccupied = table.status === 'occupied';
    const activeOrder = table.active_order;

    // Mobile: render as inline content (parent handles fullscreen wrapper)
    // Desktop: render with fixed backdrop + slide-in sidebar
    const drawerClasses = isMobile
        ? 'fixed inset-0 w-full h-[100dvh] max-w-full max-h-full m-0 p-0 rounded-none bg-[#120F1D] z-[9999] flex flex-col overflow-hidden'
        : 'fixed top-0 right-0 z-50 h-full w-full max-w-[520px] bg-background-dark/95 backdrop-blur-2xl border-l border-border-subtle shadow-2xl flex flex-col animate-slide-in-right';

    return (
        <>
            {/* Backdrop — desktop only */}
            {!isMobile && (
                <div className="fixed inset-0 z-40 bg-background-dark/70 backdrop-blur-sm" onClick={handleClose} />
            )}

            {/* Drawer */}
            <div className={drawerClasses}>

                {/* ─── Header ─── */}
                <div className={`flex items-center justify-between border-b border-border-subtle bg-surface ${isMobile ? 'p-4' : 'p-6'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`${isMobile ? 'size-10' : 'size-12'} rounded-xl flex items-center justify-center ${isOccupied ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            <span className={`material-symbols-outlined ${isMobile ? 'text-[20px]' : 'text-[24px]'}`}>table_restaurant</span>
                        </div>
                        <div>
                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-0.5 tracking-tight`}>{table.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isOccupied ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {isOccupied ? 'Ocupada' : 'Livre'} • {table.seats} Lugares
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleClose} className="size-9 flex items-center justify-center rounded-xl bg-surface hover:bg-surface-hover text-text-muted hover:text-white border border-border-subtle transition-all">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* ─── Page Error / Alerts ─── */}
                {pageError && (
                    <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        {pageError}
                    </div>
                )}

                {/* ─── Tabs Navigation ─── */}
                <div className="flex p-1.5 bg-surface border-b border-border-subtle">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'account' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white hover:bg-white/5'} ${!isOccupied ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isOccupied}
                    >
                        Conta Atual
                    </button>
                    <button
                        onClick={() => setActiveTab('add_items')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'add_items' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                    >
                        Adicionar Itens
                    </button>
                </div>

                {/* ─── Content ─── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* Active Order Section (Tab 1) */}
                    {activeTab === 'account' && activeOrder && activeOrder.items?.length > 0 && (
                        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-border-subtle bg-white/[0.01]`}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-text-muted uppercase font-bold tracking-wider">
                                    Pedido #{activeOrder.short_code || String(activeOrder.id).substring(0, 5).toUpperCase()}
                                </p>
                                <span className="text-emerald-400 text-sm font-bold bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                                    R$ {Number(activeOrder.total).toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                            <div className={`bg-surface rounded-xl border border-border-subtle divide-y divide-border-subtle ${isMobile ? 'max-h-40' : 'max-h-48'} overflow-y-auto custom-scrollbar`}>
                                {activeOrder.items.map((item, i) => (
                                    <div key={i} className="p-3 flex items-start gap-3">
                                        <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-lg flex-shrink-0 border border-white/5">
                                            {item.quantity}x
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-semibold leading-tight">
                                                {item.is_pizza && '🍕 '}{item.name}
                                            </p>
                                            {item.is_pizza && item.flavor_names?.length > 0 && (
                                                <p className="text-xs text-text-muted mt-1 leading-snug">
                                                    {item.flavor_names.length > 1
                                                        ? item.flavor_names.map(f => `1/${item.flavor_names.length} ${f}`).join(', ')
                                                        : item.flavor_names[0]
                                                    }
                                                </p>
                                            )}
                                            {item.notes && (
                                                <div className="flex items-center gap-1.5 text-xs text-orange-400 mt-1.5 bg-orange-400/10 w-fit px-2 py-0.5 rounded border border-orange-400/20">
                                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                                    {item.notes}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm text-text-muted font-medium whitespace-nowrap">
                                            R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowCheckoutModal(true)}
                                className="w-full mt-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold rounded-xl border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                Encerrar Conta
                            </button>
                        </div>
                    )}

                    {/* ─── Add Items Section (Tab 2) ─── */}
                    {activeTab === 'add_items' && (
                        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                            <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-3">
                                Adicionar Itens
                            </p>

                            {/* Search */}
                            <div className="relative mb-5">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted"
                                />
                            </div>

                            {/* Categories */}
                            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${!activeCategory ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-surface text-text-muted border-border-subtle hover:bg-surface-hover hover:text-white'}`}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-surface text-text-muted border-border-subtle hover:bg-surface-hover hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Pizza Builder CTA */}
                            {(activeCategory === 'Pizzas' || activeCategory === null) && (
                                <button
                                    onClick={() => setShowPizzaBuilder(true)}
                                    className="w-full mb-6 flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-[#7C3AED]/10 border border-primary/30 rounded-2xl hover:border-primary/50 hover:from-primary/20 hover:to-[#7C3AED]/20 transition-all group shadow-[0_0_20px_rgba(139,92,246,0.05)]"
                                >
                                    <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                        <span className="material-symbols-outlined text-[24px]">local_pizza</span>
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-white font-bold text-base mb-0.5">Montar Pizza Personalizada</p>
                                        <p className="text-text-muted text-sm group-hover:text-white/70 transition-colors">Tamanhos, sabores mistos e bordas</p>
                                    </div>
                                    <span className="material-symbols-outlined text-primary text-[24px] bg-primary/10 size-10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">arrow_forward</span>
                                </button>
                            )}

                            {/* Product List */}
                            {activeCategory !== 'Pizzas' && (
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                    {filteredItems.length === 0 && (
                                        <div className="text-center bg-surface border border-border-subtle rounded-2xl py-8">
                                            <span className="material-symbols-outlined text-4xl text-text-muted/50 mb-2">search_off</span>
                                            <p className="text-text-muted text-sm font-medium">Nenhum produto encontrado na busca.</p>
                                        </div>
                                    )}
                                    {filteredItems.map(item => (
                                        <button
                                            key={`${item.type}_${item.id}`}
                                            onClick={() => handleQuickItemClick(item)}
                                            className="w-full flex items-center gap-4 p-3.5 bg-surface hover:bg-surface-hover rounded-2xl border border-border-subtle hover:border-border-subtle-hover transition-all group text-left"
                                        >
                                            <div className="size-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white group-hover:border-primary/50 transition-all flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">add</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base text-white font-semibold truncate mb-0.5">{item.name}</p>
                                                <p className="text-xs text-text-muted">{item.category}</p>
                                            </div>
                                            <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                                <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                                                    R$ {Number(item.price).toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Cart / Footer ─── */}
                {cart.length > 0 && (
                    <div className="border-t border-border-subtle bg-surface/50 backdrop-blur-xl shrink-0">
                        <div className={`${isMobile ? 'p-3 max-h-32' : 'p-6 max-h-48'} overflow-y-auto custom-scrollbar space-y-2 border-b border-border-subtle`}>
                            <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-2">
                                Novos Itens ({cart.length})
                            </p>
                            {cart.map(item => (
                                <div key={item.key} className="flex items-center gap-4 bg-surface rounded-2xl p-3 border border-border-subtle hover:border-border-subtle-hover transition-colors shadow-sm">
                                    <div className="flex items-center gap-1.5 bg-background-dark/50 rounded-lg p-1 border border-white/5">
                                        <button onClick={() => updateQty(item.key, -1)} className="size-7 flex items-center justify-center rounded-md bg-white/5 text-text-muted hover:text-white hover:bg-white/10 text-sm font-bold transition-all">−</button>
                                        <span className="text-sm font-bold text-white w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.key, 1)} className="size-7 flex items-center justify-center rounded-md bg-white/5 text-text-muted hover:text-white hover:bg-white/10 text-sm font-bold transition-all">+</button>
                                    </div>
                                    <span className="text-sm text-white font-medium flex-1 min-w-0 truncate">
                                        {item.type === 'pizza_custom' && '🍕 '}{item.name}
                                    </span>
                                    <div className="bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                        <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <button onClick={() => removeFromCart(item.key)} className="size-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20">
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={`${isMobile ? 'p-4' : 'p-6'} bg-surface/80`}>
                            <div className="flex items-center justify-between mb-3 bg-background-dark/50 border border-white/5 p-3 rounded-xl">
                                <span className="text-sm text-text-muted font-bold tracking-wide uppercase">Total a Enviar</span>
                                <span className="text-2xl font-black text-white tracking-tight">
                                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="w-full py-4 bg-gradient-to-r from-primary to-[#7C3AED] hover:from-[#7C3AED] hover:to-primary text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                            >
                                <span className="material-symbols-outlined text-[24px]">send</span>
                                <span className="text-base tracking-wide">{sending ? 'Enviando...' : 'Enviar para Cozinha'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Item Modal (for observations on drinks, direct flavors, etc) */}
            {selectedQuickItem && (
                <div className="fixed inset-0 z-[9999]">
                    {/* Backdrop — only visible on desktop */}
                    <div className="absolute inset-0 bg-background-dark/80 sm:backdrop-blur-sm" onClick={() => setSelectedQuickItem(null)} />
                    <div className={`relative w-full h-[100dvh] bg-[#120F1D] flex flex-col overflow-hidden sm:absolute sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm sm:h-auto sm:rounded-2xl sm:border sm:border-border-subtle sm:shadow-2xl sm:animate-scale-in`}>
                        
                        {/* ── Image Placeholder ── */}
                        <div className="w-full h-44 bg-surface-hover flex items-center justify-center relative shrink-0">
                            <span className="material-symbols-outlined text-4xl text-white/5">image</span>
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#120F1D] to-transparent"></div>
                            
                            {/* Close button inside image area for native app feel */}
                            <button onClick={() => setSelectedQuickItem(null)} className="absolute top-4 right-4 size-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white transition-colors border border-white/10">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* ── Details & Ingredients ── */}
                        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="mb-5">
                                <h3 className="text-xl font-bold text-white mb-1.5 leading-tight">{selectedQuickItem.name}</h3>
                                {selectedQuickItem.ingredients && (
                                    <p className="text-sm text-text-muted mb-3 leading-snug">{selectedQuickItem.ingredients}</p>
                                )}
                                <p className="text-lg font-bold text-emerald-400 font-mono">R$ {Number(selectedQuickItem.price).toFixed(2).replace('.', ',')}</p>
                            </div>
                            
                            {/* ── Observation Field ── */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-2">Observação (Opcional)</label>
                                <textarea
                                    rows={3}
                                    placeholder={
                                        selectedQuickItem?.category === 'Pizzas' || selectedQuickItem?.name?.toLowerCase().includes('pizza')
                                            ? "Ex: Sem orégano, bem assada, borda fina..."
                                            : "Ex: Com gelo e limão, sem açúcar..."
                                    }
                                    value={quickObservation}
                                    onChange={e => setQuickObservation(e.target.value)}
                                    className="w-full bg-background-dark border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-text-muted/50 resize-none"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            confirmQuickItem();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* ── Footer ── */}
                        <div className="p-4 border-t border-border-subtle bg-surface shrink-0">
                            <button
                                onClick={confirmQuickItem}
                                className="w-full py-4 bg-primary hover:bg-[#7C3AED] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                Adicionar ao Pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pizza Builder Modal — overlays on top of the drawer */}
            {showPizzaBuilder && (
                <PizzaBuilderModal
                    isOpen={showPizzaBuilder}
                    onClose={() => setShowPizzaBuilder(false)}
                    onConfirm={handlePizzaConfirm}
                    pizzaSizes={pizzaSizes}
                    pizzaFlavors={pizzaFlavors}
                    borderOptions={borderOptions}
                />
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && activeOrder && (
                <div className="fixed inset-0 z-[9999]">
                    <div className="absolute inset-0 bg-background-dark/80 sm:backdrop-blur-sm" onClick={() => !checkingOut && setShowCheckoutModal(false)} />
                    <div className={`relative w-full h-[100dvh] bg-[#120F1D] flex flex-col overflow-hidden sm:absolute sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm sm:h-auto sm:max-h-[85vh] sm:rounded-2xl sm:border sm:border-border-subtle sm:shadow-2xl sm:animate-scale-in`}>
                        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-0.5">Encerrar Conta</h3>
                                <p className="text-sm font-bold text-emerald-400">Total: R$ {Number(activeOrder.total).toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-white/10 text-white text-xs font-bold transition-colors border border-border-subtle shadow-lg">
                                    <span className="material-symbols-outlined text-[16px]">print</span>
                                    <span>Conferência</span>
                                </button>
                                <button onClick={() => !checkingOut && setShowCheckoutModal(false)} className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 max-h-[60vh]">
                            <label className="block text-sm font-bold text-white mb-2">Adicionar Pagamento</label>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {[
                                    { method: 'dinheiro', icon: 'payments', label: 'Dinheiro' },
                                    { method: 'pix', icon: 'qr_code_2', label: 'Pix' },
                                    { method: 'credito', icon: 'credit_card', label: 'Crédito' },
                                    { method: 'debito', icon: 'credit_card', label: 'Débito' },
                                ].map(m => (
                                    <button
                                        key={m.method}
                                        onClick={() => setCheckoutPaymentMethod(m.method)}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${checkoutPaymentMethod === m.method
                                            ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                            : 'bg-background-dark border-border-subtle text-text-muted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[24px]">{m.icon}</span>
                                        <span className="text-[11px] font-bold uppercase tracking-wider">{m.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 mb-6">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={paymentInputValue}
                                        onChange={e => setPaymentInputValue(e.target.value)}
                                        className="w-full bg-background-dark border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-white font-mono font-bold focus:border-primary/50 outline-none transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const val = parseFloat(paymentInputValue);
                                        if (val > 0) {
                                            setPayments(prev => [...prev, { id: Date.now(), method: checkoutPaymentMethod, amount: val, label: checkoutPaymentMethod }]);
                                            setPaymentInputValue('');
                                        }
                                    }}
                                    disabled={!paymentInputValue || parseFloat(paymentInputValue) <= 0}
                                    className="px-4 py-3 bg-primary hover:bg-[#7C3AED] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                </button>
                            </div>

                            {/* Added Payments List */}
                            {payments.length > 0 && (
                                <div className="space-y-2 mb-2">
                                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Pagamentos Adicionados</p>
                                    {payments.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-background-dark p-3 rounded-xl border border-border-subtle group">
                                            <span className="text-white text-sm font-bold capitalize">{p.method}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-emerald-400 font-mono font-bold">R$ {p.amount.toFixed(2).replace('.', ',')}</span>
                                                <button onClick={() => setPayments(prev => prev.filter(x => x.id !== p.id))} className="text-text-muted hover:text-red-400 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Summary & Confirm */}
                        <div className="p-5 border-t border-border-subtle bg-white/[0.01] shrink-0">
                            {(() => {
                                const total = parseFloat(activeOrder.total);
                                const paid = payments.reduce((acc, curr) => acc + curr.amount, 0);
                                const remaining = Math.max(0, total - paid);
                                const change = Math.max(0, paid - total);
                                const canFinalize = payments.length > 0 && remaining <= 0;

                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                                                <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">Restante</span>
                                                <span className={`text-lg font-black font-mono ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    R$ {remaining.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                            <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                                                <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">Troco</span>
                                                <span className={`text-lg font-black font-mono ${change > 0 ? 'text-primary' : 'text-text-muted'}`}>
                                                    R$ {change.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut || !canFinalize}
                                            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg disabled:shadow-none disabled:bg-surface disabled:text-text-muted disabled:opacity-100 disabled:border disabled:border-border-subtle bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 text-white"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{canFinalize ? 'done_all' : 'lock'}</span>
                                            {checkingOut ? 'Aguarde...' : canFinalize ? 'Confirmar e Fechar Mesa' : 'Valor Insuficiente'}
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Container for the Receipt */}
            <ReceiptPrint order={activeOrder} />
        </>
    );
}
