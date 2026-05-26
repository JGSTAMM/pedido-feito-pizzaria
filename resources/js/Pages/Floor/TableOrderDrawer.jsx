import { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import CustomNumberInput from '@/Components/CustomNumberInput';
import { norm } from '@/utils/normalize';
import PizzaBuilderModal from '@/Pages/POS/PizzaBuilderModal';
import ProductVariationModal from '@/Pages/POS/ProductVariationModal';
import ReceiptPrint from '@/Components/ReceiptPrint';
import useI18n from '@/hooks/useI18n';

const WaiterCartItem = ({ item, updateQty, removeFromCart, formatCurrency, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse notes and exclusions if present
    const notesArray = item.observation ? item.observation.split('|').map(n => n.trim()).filter(Boolean) : [];

    // For custom pizzas, the 'description' field holds the flavor string (e.g., '1/2 Bacon, 1/2 Queijo')
    const isPizza = item.type === 'pizza_custom';
    const hasFlavorsText = isPizza && item.description && item.description.trim() !== '';

    // Has extra details to show?
    const hasValidBorder = item.border && typeof item.border === 'string' && item.border.toLowerCase() !== 'sem borda';
    const hasDetails = hasFlavorsText || notesArray.length > 0 || hasValidBorder;

    return (
        <div className="flex flex-col gap-2 bg-surface rounded-2xl p-3 border border-border-subtle shadow-sm">
            {/* Top Row: Name and Expand button */}
            <div className="flex items-start justify-between gap-2">""
                <div className="flex items-start gap-2 flex-1">
                    <span className="text-base mt-0.5 flex-shrink-0">{isPizza ? '🍕' : '📦'}</span>
                    <span className="text-sm text-white font-medium break-words leading-tight">
                        {item.name}
                    </span>
                </div>
                {hasDetails && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-md bg-white/5 text-text-muted hover:text-white transition-colors flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                )}
            </div>

            {/* Expanded Details */}
            {isExpanded && hasDetails && (
                <div className="pl-6 pr-2 py-2 space-y-2 border-l-2 border-border-subtle ml-2">
                    {/* Flavors */}
                    {hasFlavorsText && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{t('floor.drawer.cart.flavors_label')}</p>
                            <div className="text-xs text-white/80 space-y-0.5">
                                {item.description.split(', ').map((flavor, idx) => (
                                    <div key={idx}>• {flavor}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Border */}
                    {hasValidBorder && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{t('floor.drawer.cart.border_label')}</p>
                            <div className="text-xs text-white/80">
                                • {item.border}
                            </div>
                        </div>
                    )}
                    {/* Notes */}
                    {notesArray.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{t('floor.drawer.cart.observations_label')}</p>
                            {notesArray.map((note, i) => {
                                const isExclusion = note.toLowerCase().startsWith('sem ') || note.toLowerCase().startsWith('retirar ') || note.toLowerCase().startsWith('no ');
                                const isPizza = item.type === 'pizza_custom';
                                
                                return (
                                    <div 
                                        key={i} 
                                        className={`text-[11px] px-2 py-1 rounded flex items-center gap-1.5 font-bold uppercase tracking-wide
                                            ${isPizza 
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">
                                            {isPizza ? 'warning' : 'info'}
                                        </span>
                                        {note}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Row: Actions */}
            <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5 bg-background-dark/50 rounded-lg p-1 border border-white/5">
                    <button onClick={() => updateQty(item.key, -1)} className="size-8 flex items-center justify-center rounded-md bg-white/5 text-text-muted hover:text-white hover:bg-white/10 text-lg font-bold transition-all">−</button>
                    <span className="text-sm font-bold text-white w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.key, 1)} className="size-8 flex items-center justify-center rounded-md bg-white/5 text-text-muted hover:text-white hover:bg-white/10 text-lg font-bold transition-all">+</button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                        <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                        </span>
                    </div>
                    <button onClick={() => removeFromCart(item.key)} className="size-9 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all border border-transparent hover:border-red-400/20">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    const { t, formatCurrency } = useI18n();
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
    const [initialPizzaFlavor, setInitialPizzaFlavor] = useState(null);
    const [showVariationModal, setShowVariationModal] = useState(false);
    const [productToVariate, setProductToVariate] = useState(null);
    const [sending, setSending] = useState(false);
    const [pageError, setPageError] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Quick Item Modal state
    const [selectedQuickItem, setSelectedQuickItem] = useState(null);
    const [quickObservation, setQuickObservation] = useState('');

    // Checkout Modal state
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('dinheiro');
    const [checkingOut, setCheckingOut] = useState(false);
    const [payments, setPayments] = useState([]);
    const [paymentInputValue, setPaymentInputValue] = useState('');

    // Dynamic PIX state and refs
    const [generatingPix, setGeneratingPix] = useState(false);
    const [pixQrCode, setPixQrCode] = useState(null);
    const [pixQrCodeBase64, setPixQrCodeBase64] = useState(null);
    const [pixGatewayPaymentId, setPixGatewayPaymentId] = useState(null);
    const [pixExpiresAt, setPixExpiresAt] = useState(null);
    const [pixError, setPixError] = useState('');
    const [pixApproved, setPixApproved] = useState(false);
    const [pixCountdown, setPixCountdown] = useState(600);
    const [pixAmount, setPixAmount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isQrFullscreen, setIsQrFullscreen] = useState(false);

    const pollingIntervalRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    // Format Countdown to MM:SS
    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Clean up tracking on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, []);

    // Stop PIX tracking and reset variables
    const stopPixTracking = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setGeneratingPix(false);
        setPixQrCode(null);
        setPixQrCodeBase64(null);
        setPixGatewayPaymentId(null);
        setPixExpiresAt(null);
        setPixError('');
        setPixApproved(false);
        setPixCountdown(600);
        setPixAmount(0);
        setCopied(false);
    };

    // Generate BRL PIX Payment via Mercado Pago
    const generatePixPayment = (amount) => {
        setGeneratingPix(true);
        setPixError('');
        setPixApproved(false);
        setPixAmount(amount);

        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        axios.post(`/floor/${table.id}/generate-pix`, { amount })
            .then(res => {
                if (res.data && res.data.success) {
                    setPixQrCode(res.data.qr_code);
                    setPixQrCodeBase64(res.data.qr_code_base64);
                    setPixGatewayPaymentId(res.data.gateway_payment_id);
                    setPixExpiresAt(res.data.expires_at);

                    // Setup countdown timer
                    let initialSeconds = 600;
                    if (res.data.expires_at) {
                        const secondsLeft = Math.floor((new Date(res.data.expires_at).getTime() - Date.now()) / 1000);
                        if (secondsLeft > 0 && secondsLeft <= 600) {
                            initialSeconds = secondsLeft;
                        }
                    }
                    setPixCountdown(initialSeconds);

                    countdownIntervalRef.current = setInterval(() => {
                        setPixCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(countdownIntervalRef.current);
                                setPixError(t('floor.drawer.pix.error'));
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    // Setup polling status every 5 seconds
                    const orderId = res.data.order_id;
                    pollingIntervalRef.current = setInterval(() => {
                        axios.get(`/floor/pix-status/${orderId}`)
                            .then(statusRes => {
                                if (statusRes.data && statusRes.data.status === 'approved') {
                                    clearInterval(pollingIntervalRef.current);
                                    pollingIntervalRef.current = null;
                                    clearInterval(countdownIntervalRef.current);
                                    countdownIntervalRef.current = null;

                                    setPixApproved(true);

                                    // Add payment
                                    const newPayment = {
                                        id: Date.now(),
                                        method: 'pix',
                                        amount: amount,
                                        label: 'pix'
                                    };

                                    setPayments(prev => {
                                        const updatedPayments = [...prev, newPayment];
                                        const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                                        const remaining = tableTotal - totalPaid;

                                        if (remaining <= 0.01) {
                                            setTimeout(() => {
                                                handleCheckout(updatedPayments);
                                            }, 1500);
                                        } else {
                                            setTimeout(() => {
                                                stopPixTracking();
                                            }, 1500);
                                        }
                                        return updatedPayments;
                                    });
                                }
                            })
                            .catch(err => {
                                console.error('Error checking pix status:', err);
                            });
                    }, 5000);
                } else {
                    setPixError(res.data.error || t('floor.drawer.pix.error'));
                }
            })
            .catch(err => {
                setPixError(err.response?.data?.error || t('floor.drawer.pix.error'));
            })
            .finally(() => {
                setGeneratingPix(false);
            });
    };

    // Copy Pix payload to clipboard
    const handleCopyCode = () => {
        if (!pixQrCode) return;
        navigator.clipboard.writeText(pixQrCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Auto-close fullscreen overlay when PIX is approved
    useEffect(() => {
        if (pixApproved) {
            setIsQrFullscreen(false);
        }
    }, [pixApproved]);

    // Tabs: 'account' or 'add_items'. Safely check table?.status since it evaluates before early return.
    const [activeTab, setActiveTab] = useState(table?.status === 'occupied' ? 'account' : 'add_items');

    // ── Data Bridge ──
    const activeOrder = table?.active_order;
    const activeOrders = Array.isArray(table?.active_orders) ? table.active_orders : [];
    const tableTotal = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // ── Catalog Filtering ──
    const allItems = useMemo(() => [...products, ...pizzaFlavors], [products, pizzaFlavors]);

    const filteredItems = useMemo(() => {
        let items = allItems;

        if (activeCategory) {
            items = items.filter(i => i.category === activeCategory || (i.category && i.category.name === activeCategory));
        }

        if (searchTerm) {
            const q = norm(searchTerm);
            items = items.filter(i => norm(i.name).includes(q));
        }

        // Default sort if no category or search
        if (!activeCategory && !searchTerm) {
            items.sort((a, b) => {
                const getPriority = (item) => {
                    if (item.category === 'Promoções' || item.category === 'Extras') return 1;
                    if (item.category === 'Bebidas') return 2;
                    return 3;
                };
                return getPriority(a) - getPriority(b);
            });
        }
        return items;
    }, [allItems, activeCategory, searchTerm]);

    // ── Cart Actions ──

    // Smart Shortcut: If it's a pizza flavor, open the builder. Otherwise open quick observation modal.
    const handleQuickItemClick = (item) => {
        const isPizza = item.type === 'pizza_flavor' || item.category === 'Pizzas';
        if (isPizza) {
            setInitialPizzaFlavor(item);
            setShowPizzaBuilder(true);
            return;
        }

        // Robust check: backend may send variations as a JSON string OR a parsed Array.
        let variations = item.variations;
        if (typeof variations === 'string') {
            try { variations = JSON.parse(variations); } catch { variations = []; }
        }
        const hasVariations = Array.isArray(variations) && variations.length > 0;

        if (hasVariations) {
            // Normalise the item so ProductVariationModal always receives an Array
            setProductToVariate({ ...item, variations });
            setShowVariationModal(true);
            return;
        }

        setSelectedQuickItem(item);
        setQuickObservation('');
    };

    const handleVariationConfirm = (product, variation) => {
        setCart(prev => {
            const variationNote = variation.name;
            const existing = prev.find(c => c.id === product.id && c.type === product.type && c.observation === variationNote);

            if (existing) {
                return prev.map(c =>
                    c.key === existing.key ? { ...c, quantity: c.quantity + 1 } : c
                );
            }

            return [...prev, {
                ...product,
                name: `${product.name} (${variation.name})`,
                price: Number(variation.price),
                quantity: 1,
                observation: variationNote,
                key: `${product.type}_${product.id}_var_${variation.name}_${Date.now()}`
            }];
        });
        setShowVariationModal(false);
        setProductToVariate(null);
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
        setInitialPizzaFlavor(null);
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
                    observation: item.observation || null,
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

    const handleCheckout = async (paymentsToSend = payments) => {
        if (!activeOrder || paymentsToSend.length === 0) return;
        setCheckingOut(true);

        router.post(`/floor/${table.id}/pay`, {
            payments: paymentsToSend.map(p => ({ method: p.method, amount: p.amount }))
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCheckoutModal(false);
                setPayments([]);
                setCheckingOut(false);
                stopPixTracking();
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
        setInitialPizzaFlavor(null);
        setShowVariationModal(false);
        setProductToVariate(null);
        setPayments([]);
        setPaymentInputValue('');
        setPageError('');
        stopPixTracking();
        // Reset tab based on table status when reopening
        setActiveTab(table?.status === 'occupied' ? 'account' : 'add_items');
        onClose();
    };

    if (!isOpen || !table) return null;

    const isOccupied = table.status === 'occupied';

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
                                    {isOccupied ? t('floor.drawer.statusOccupied') : t('floor.drawer.statusFree')} • {t('floor.drawer.seats', { count: table.seats })}
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
                        {t('floor.drawer.tabs.account')}
                    </button>
                    <button
                        onClick={() => setActiveTab('add_items')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'add_items' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                    >
                        {t('floor.drawer.tabs.addItems')}
                    </button>
                </div>

                {/* ─── Content ─── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* Active Orders Section (Tab 1) */}
                    {activeTab === 'account' && (
                        <div className={`${isMobile ? 'p-4' : 'p-6'} border-b border-border-subtle bg-white/[0.01] space-y-6`}>
                            {activeOrders.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">{t('floor.drawer.tabs.account')}</h3>
                                        <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                            <span className="text-emerald-400 text-lg font-black tracking-tight">
                                                {formatCurrency(tableTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {activeOrders.map((order, oIdx) => (
                                            <div key={order.id} className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
                                                {/* Order Header */}
                                                <div className="bg-white/5 px-4 py-4 border-b border-border-subtle flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em] mb-1 leading-none">
                                                            {t('floor.drawer.orderCode')}
                                                        </p>
                                                        <span className="text-3xl font-black text-white tracking-tighter leading-none">
                                                            #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        {order.created_at_time && (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                                                <span className="material-symbols-outlined text-[14px] text-text-muted">schedule</span>
                                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                                                                    {t('floor.table.orderTime', { time: order.created_at_time })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {order.ready_at_time ? (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                                                                <span className="text-xs font-black uppercase text-emerald-400 tracking-tight">
                                                                    {t('floor.table.readyAt', { time: order.ready_at_time })}
                                                                    {order.lead_time && ` • ${order.lead_time}min`}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                                                <span className="material-symbols-outlined text-[16px] text-orange-400 animate-pulse">timer</span>
                                                                <span className="text-xs font-black uppercase text-orange-400 tracking-tight">
                                                                    {t('floor.table.elapsedMinutes', { count: Math.floor(order.elapsed_minutes || 0) })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Order Items */}
                                                <div className="divide-y divide-border-subtle">
                                                    {order.items?.map((item, i) => (
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
                                                                    <div className="mt-2 space-y-1">
                                                                        {item.notes.split('|').map((note, idx) => {
                                                                            const isPizzaItem = item.is_pizza;

                                                                            return (
                                                                                <div key={idx} className={`flex items-start gap-1.5 p-2 rounded-lg border text-[11px] font-bold uppercase tracking-wide leading-tight
                                                                                    ${isPizzaItem 
                                                                                        ? 'bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                                                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                                                                    <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">
                                                                                        {isPizzaItem ? 'warning' : 'info'}
                                                                                    </span>
                                                                                    <span className="flex-1">{note.trim().replace(/^⚠️\s*/, '')}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-text-muted font-medium whitespace-nowrap">
                                                                {formatCurrency(Number(item.subtotal) || 0)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Order Footer */}
                                                <div className="bg-black/20 px-4 py-2 flex justify-end">
                                                    <span className="text-xs font-bold text-white">
                                                        {t('floor.drawer.cart.subtotal_label')}: {formatCurrency(Number(order.total) || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setShowCheckoutModal(true)}
                                        className="w-full py-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold rounded-2xl border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(239,68,68,0.15)]"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                        {t('floor.drawer.actions.closeAccount')}
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                        <span className="material-symbols-outlined text-4xl text-text-muted">history</span>
                                    </div>
                                    <h4 className="text-white font-bold mb-1">{t('floor.drawer.noOrdersTitle')}</h4>
                                    <p className="text-text-muted text-sm max-w-[200px]">{t('floor.drawer.noOrdersSubtitle')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Add Items Section (Tab 2) ─── */}
                    {activeTab === 'add_items' && (
                        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
                            <h3 className="text-lg font-bold text-white mb-4">{t('floor.drawer.tabs.addItems')}</h3>
                            <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-3">
                                {t('floor.drawer.addItems.title')}
                            </p>

                            {/* Search */}
                            <div className="relative mb-5">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder={t('floor.drawer.addItems.searchPlaceholder')}
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
                                    {t('floor.drawer.addItems.all')}
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
                                    className="w-full mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-[#06b6d4]/10 border border-primary/30 rounded-2xl hover:border-primary/50 hover:from-primary/20 hover:to-[#06b6d4]/20 transition-all group shadow-[0_0_20px_rgba(139,92,246,0.05)]"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
                                            <span className="material-symbols-outlined text-[24px]">local_pizza</span>
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-white font-bold text-base mb-0.5">{t('digital_menu.catalog.build_pizza')}</p>
                                            <p className="text-text-muted text-sm group-hover:text-white/70 transition-colors">{t('floor.drawer.addItems.customPizzaSubtitle')}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-primary text-[24px] bg-primary/10 size-10 flex items-center justify-center rounded-lg group-hover:bg-primary group-hover:text-white transition-colors shrink-0">arrow_forward</span>
                                </button>
                            )}

                            {/* Product List */}
                            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                {filteredItems.length === 0 && (
                                    <div className="text-center bg-surface border border-border-subtle rounded-2xl py-8">
                                        <span className="material-symbols-outlined text-4xl text-text-muted/50 mb-2">search_off</span>
                                        <p className="text-text-muted text-sm font-medium">{t('floor.drawer.addItems.emptySearch')}</p>
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
                                                {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Cart / Footer ─── */}
                {cart.length > 0 && !isCartOpen && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-40">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full bg-gradient-to-r from-primary to-[#06b6d4] hover:from-[#06b6d4] hover:to-primary text-white p-4 rounded-full shadow-[0_10px_40px_rgba(139,92,246,0.4)] border border-white/20 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-black/20 rounded-full p-2 size-10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">{cart.length} {cart.length === 1 ? t('floor.drawer.cart.item_singular') : t('floor.drawer.cart.item_plural')}</p>
                                    <p className="text-xs text-white/70 tracking-wide uppercase font-black">{t('floor.drawer.cart.view')}</p>
                                </div>
                            </div>
                            <span className="text-xl font-black">{formatCurrency(cartTotal)}</span>
                        </button>
                    </div>
                )}

                {cart.length > 0 && isCartOpen && (
                    <div className="absolute inset-x-0 bottom-0 z-50 bg-[#1A1A24]/95 backdrop-blur-xl border-t border-border-subtle rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                                {t('floor.drawer.cart.title')}
                            </h3>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1 min-h-[30vh]">
                            {cart.map(item => (
                                <WaiterCartItem
                                    key={item.key}
                                    item={item}
                                    updateQty={updateQty}
                                    removeFromCart={removeFromCart}
                                    formatCurrency={formatCurrency}
                                    t={t}
                                />
                            ))}
                        </div>

                        {/* Footer */}
                        <div className={`${isMobile ? 'p-4' : 'p-6'} bg-surface/80 shrink-0`}>
                            <div className="flex items-center justify-between mb-3 bg-background-dark/50 border border-white/5 p-3 rounded-xl">
                                <span className="text-sm text-text-muted font-bold tracking-wide uppercase">{t('floor.drawer.cart.totalToSend')}</span>
                                <span className="text-2xl font-black text-white tracking-tight">
                                    {formatCurrency(cartTotal)}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    handleSend();
                                    setIsCartOpen(false);
                                }}
                                disabled={sending}
                                className="w-full py-4 bg-gradient-to-r from-primary to-[#06b6d4] hover:from-[#06b6d4] hover:to-primary text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                            >
                                <span className="material-symbols-outlined text-[24px]">send</span>
                                <span className="text-base tracking-wide">{sending ? t('floor.drawer.cart.sending') : t('floor.drawer.cart.sendToKitchen')}</span>
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
                                <p className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(selectedQuickItem.price)}</p>
                            </div>

                            {/* ── Observation Field ── */}
                            <div>
                                <label className="block text-sm font-bold text-white mb-2">{t('floor.drawer.quickItem.observationOptional')}</label>
                                <textarea
                                    rows={3}
                                    placeholder={
                                        selectedQuickItem?.category === 'Pizzas' || selectedQuickItem?.name?.toLowerCase().includes('pizza')
                                            ? t('floor.drawer.quickItem.pizzaObservationPlaceholder')
                                            : t('floor.drawer.quickItem.defaultObservationPlaceholder')
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
                                className="w-full py-4 bg-primary hover:bg-[#06b6d4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                {t('floor.drawer.quickItem.addToOrder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pizza Builder Modal — overlays on top of the drawer */}
            {showPizzaBuilder && (
                <PizzaBuilderModal
                    isOpen={showPizzaBuilder}
                    onClose={() => {
                        setShowPizzaBuilder(false);
                        setInitialPizzaFlavor(null);
                    }}
                    onConfirm={handlePizzaConfirm}
                    pizzaSizes={pizzaSizes}
                    pizzaFlavors={pizzaFlavors}
                    borderOptions={borderOptions}
                    initialFlavor={initialPizzaFlavor}
                />
            )}

            {/* Product Variation Modal */}
            {showVariationModal && (
                <ProductVariationModal
                    isOpen={showVariationModal}
                    onClose={() => {
                        setShowVariationModal(false);
                        setProductToVariate(null);
                    }}
                    onConfirm={handleVariationConfirm}
                    product={productToVariate}
                />
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && activeOrder && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-2 sm:p-4">
                    <div
                        className="absolute inset-0 bg-[#0D0D12]/40 backdrop-blur-md animate-fade-in"
                        onClick={() => !checkingOut && setShowCheckoutModal(false)}
                    />

                    <div className="relative w-full max-w-lg max-h-[92dvh] bg-[#12121A]/95 sm:bg-[#12121A]/80 backdrop-blur-2xl border border-white/10 rounded-t-[32px] sm:rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-scale-in">


                        {/* Header Section */}
                        <div className="p-4 sm:p-8 pb-2 sm:pb-4 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400">account_balance_wallet</span>
                                    {t('floor.drawer.checkout.title')}
                                </h3>
                                <p className="text-text-muted text-[11px] sm:text-sm font-medium mt-0.5 sm:mt-1 leading-tight">{t('floor.drawer.checkout.subtitle')}</p>
                            </div>
                            <button
                                onClick={() => !checkingOut && setShowCheckoutModal(false)}
                                className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Summary Dashboard - Fixed at top */}
                        <div className="px-4 sm:px-8 py-2 sm:py-4 grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
                            <div className="col-span-2 bg-emerald-500/5 border border-emerald-500/20 p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="material-symbols-outlined text-4xl sm:text-6xl text-emerald-400">payments</span>
                                </div>
                                <p className="text-[9px] sm:text-[10px] uppercase font-black text-emerald-400/60 tracking-[0.2em] mb-1">{t('floor.drawer.checkout.total_label')}</p>
                                <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter">
                                    {formatCurrency(tableTotal)}
                                </p>
                            </div>

                            {/* Remaining Card */}
                            <div className={`p-3 sm:p-4 rounded-[16px] sm:rounded-[20px] border transition-all ${(tableTotal - payments.reduce((s, p) => s + p.amount, 0)) > 0.01
                                    ? 'bg-orange-500/5 border-orange-500/20'
                                    : 'bg-emerald-500/5 border-emerald-500/20'
                                }`}>
                                <p className="text-[8px] sm:text-[9px] uppercase font-bold text-text-muted tracking-widest mb-0.5 sm:mb-1">{t('floor.drawer.checkout.remaining_label')}</p>
                                <p className={`text-base sm:text-xl font-black tracking-tight ${(tableTotal - payments.reduce((s, p) => s + p.amount, 0)) > 0.01
                                        ? 'text-orange-400'
                                        : 'text-emerald-400'
                                    }`}>
                                    {formatCurrency(Math.max(0, tableTotal - payments.reduce((s, p) => s + p.amount, 0)))}
                                </p>
                            </div>

                            {/* Change Card */}
                            <div className="bg-blue-500/5 border border-blue-500/20 p-3 sm:p-4 rounded-[16px] sm:rounded-[20px]">
                                <p className="text-[8px] sm:text-[9px] uppercase font-bold text-text-muted tracking-widest mb-0.5 sm:mb-1">{t('floor.drawer.checkout.change_label')}</p>
                                <p className="text-base sm:text-xl font-black text-blue-400 tracking-tight">
                                    {formatCurrency(Math.max(0, payments.reduce((s, p) => s + p.amount, 0) - tableTotal))}
                                </p>
                            </div>
                        </div>

                        {generatingPix || pixQrCode || pixError || pixApproved ? (
                            <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
                                {/* Scrollable Pix Content */}
                                <div className="px-4 sm:px-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 min-h-0">
                                    <div className="w-full text-center mx-auto shrink-0">
                                        <h4 className="text-lg font-black text-white tracking-tight flex items-center justify-center gap-2">
                                            <span className={`material-symbols-outlined text-xl ${pixApproved ? 'text-emerald-400 animate-bounce' : 'text-amber-400 animate-pulse'}`}>
                                                {pixApproved ? 'check_circle' : 'qr_code_scanner'}
                                            </span>
                                            {t('floor.drawer.pix.title')}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {t('floor.drawer.pix.scanHint')}
                                        </p>
                                    </div>

                                    {/* Glassmorphic card for QR Code with smooth glows */}
                                    <div className="relative p-4 sm:p-6 rounded-[28px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center space-y-4 group overflow-hidden max-w-[280px] w-full mx-auto shrink-0">
                                        {/* Soft pulsing glow behind the QR code */}
                                        <div className={`absolute inset-0 -z-10 opacity-30 blur-2xl transition-all duration-700 ${
                                            pixApproved 
                                                ? 'bg-emerald-500/20 group-hover:scale-110 animate-pulse' 
                                                : 'bg-amber-500/10 group-hover:scale-110'
                                        }`} />

                                        {generatingPix ? (
                                            <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center space-y-3">
                                                <div className="size-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest animate-pulse">
                                                    {t('floor.drawer.pix.generating')}
                                                </span>
                                            </div>
                                        ) : pixError ? (
                                            <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center text-center p-4">
                                                <span className="material-symbols-outlined text-red-400 text-4xl mb-2 animate-bounce">error</span>
                                                <span className="text-xs text-red-400 font-bold leading-normal">
                                                    {pixError}
                                                </span>
                                            </div>
                                        ) : pixApproved ? (
                                            <div className="w-40 sm:w-48 aspect-square shrink-0 flex flex-col items-center justify-center text-center">
                                                <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3 animate-scale-in">
                                                    <span className="material-symbols-outlined text-emerald-400 text-3xl">check</span>
                                                </div>
                                                <span className="text-sm text-emerald-400 font-black uppercase tracking-wider">
                                                    {t('floor.drawer.pix.approved')}
                                                </span>
                                            </div>
                                        ) : pixQrCodeBase64 ? (
                                            <button
                                                onClick={() => setIsQrFullscreen(true)}
                                                className="w-full py-4 px-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 active:scale-95 group relative overflow-hidden flex flex-row items-center justify-between shrink-0"
                                            >
                                                {/* Subtle pulsing glow background */}
                                                <div className="absolute inset-0 bg-amber-500/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                
                                                {/* Left: QR Icon */}
                                                <div className="size-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center relative z-10 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                                    <span className="material-symbols-outlined text-amber-400 text-[22px]">qr_code_2</span>
                                                </div>
                                                
                                                {/* Middle: Explicit Text with Fallbacks */}
                                                <div className="flex flex-col items-start flex-1 min-w-0 mx-4 relative z-10 text-left">
                                                    <span className="font-black text-sm uppercase tracking-widest text-amber-400 truncate w-full">
                                                        {t('floor.drawer.pix.enlargeQr') || 'AMPLIAR QR CODE'}
                                                    </span>
                                                    <span className="text-[10px] text-amber-400/70 font-medium truncate w-full">
                                                        {t('floor.drawer.pix.enlargeHint') || 'Toque para tela cheia'}
                                                    </span>
                                                </div>

                                                {/* Right: Action Icon */}
                                                <div className="relative z-10 shrink-0 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-amber-400/80 text-[24px] group-hover:translate-x-1 group-hover:text-amber-300 transition-all">fullscreen</span>
                                                </div>
                                            </button>
                                        ) : null}

                                        {/* Display BRL amount & countdown */}
                                        <div className="w-full text-center space-y-1">
                                            <p className="text-sm font-black text-white">
                                                {t('floor.drawer.pix.remainingAmount').replace(':amount', formatCurrency(pixAmount))}
                                            </p>
                                            {!pixApproved && !pixError && !generatingPix && (
                                                <p className="text-[10px] font-bold text-amber-400/90 tracking-wider">
                                                    {t('floor.drawer.pix.countdown').replace(':time', formatCountdown(pixCountdown))}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Copy Pix paste key & status indicator */}
                                    {pixQrCode && !pixApproved && !pixError && (
                                        <div className="w-full max-w-sm space-y-3 mx-auto shrink-0">
                                            <button
                                                onClick={handleCopyCode}
                                                className={`w-full py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                                    copied 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                        : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-base">
                                                    {copied ? 'check' : 'content_copy'}
                                                </span>
                                                <span>{copied ? t('floor.drawer.pix.pixCopiar') + ' (Copiado!)' : t('floor.drawer.pix.pixCopiar')}</span>
                                            </button>

                                            <div className="flex items-center justify-center gap-2 bg-amber-500/5 border border-amber-500/10 py-2.5 px-4 rounded-xl">
                                                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                                                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                                    {t('floor.drawer.pix.waitingApproval')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action bar for PIX view (Voltar/Cancelar) */}
                                <div className="p-4 sm:p-8 pt-2 sm:pt-4 bg-white/[0.04] sm:bg-white/[0.02] border-t border-white/10 flex flex-col gap-2 sm:gap-3 shrink-0 pb-safe">
                                    <button
                                        onClick={stopPixTracking}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white hover:text-red-400 text-xs sm:text-sm font-black rounded-xl transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                        <span>{t('floor.drawer.pix.cancel')}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Interaction Area - Scrollable Body */}
                                <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 sm:space-y-6 min-h-0">

                                    {/* Payment Methods Grid */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">{t('floor.drawer.checkout.payment_method_label')}</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { method: 'dinheiro', icon: 'payments', label: t('floor.drawer.methods.dinheiro') },
                                                { method: 'pix', icon: 'qr_code_2', label: t('floor.drawer.methods.pix') },
                                                { method: 'credito', icon: 'credit_card', label: t('floor.drawer.methods.credito') },
                                                { method: 'debito', icon: 'credit_card', label: t('floor.drawer.methods.debito') },
                                            ].map(m => (
                                                <button
                                                    key={m.method}
                                                    onClick={() => {
                                                        setCheckoutPaymentMethod(m.method);
                                                        if (!paymentInputValue) {
                                                            const remaining = Math.max(0, tableTotal - payments.reduce((s, p) => s + p.amount, 0));
                                                            if (remaining > 0) setPaymentInputValue(remaining.toFixed(2));
                                                        }
                                                    }}
                                                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border transition-all duration-300 group ${checkoutPaymentMethod === m.method
                                                            ? 'bg-white/10 border-white/20 text-white shadow-lg scale-[1.02]'
                                                            : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/[0.08] hover:text-white'
                                                        }`}
                                                >
                                                    {/* Method Icon Container Classes */}
                                                    <div className={`size-8 sm:size-10 rounded-xl flex items-center justify-center transition-colors ${checkoutPaymentMethod === m.method ? 'bg-white text-black' : 'bg-white/5 text-white/40'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{m.icon}</span>
                                                    </div>
                                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">{m.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Amount Input */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <label className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-[0.1em] ml-1">{t('floor.drawer.checkout.payment_amount_label')}</label>
                                        <div className="flex gap-2">
                                                <CustomNumberInput
                                                    value={paymentInputValue}
                                                    onChange={val => setPaymentInputValue(val)}
                                                    onFocus={() => {
                                                        if (!paymentInputValue) {
                                                            const remaining = Math.max(0, tableTotal - payments.reduce((s, p) => s + p.amount, 0));
                                                            if (remaining > 0) setPaymentInputValue(remaining.toFixed(2));
                                                        }
                                                    }}
                                                    prefix="R$"
                                                    step={0.01}
                                                    min={0.01}
                                                    placeholder="0,00"
                                                    className="w-full"
                                                />
                                            <button
                                                onClick={() => {
                                                    const val = parseFloat(paymentInputValue);
                                                    if (val > 0) {
                                                        if (checkoutPaymentMethod === 'pix') {
                                                            generatePixPayment(val);
                                                        } else {
                                                            setPayments(prev => [...prev, { id: Date.now(), method: checkoutPaymentMethod, amount: val, label: checkoutPaymentMethod }]);
                                                            setPaymentInputValue('');
                                                        }
                                                    }
                                                }}
                                                disabled={!paymentInputValue || parseFloat(paymentInputValue) <= 0}
                                                className="px-5 sm:px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:bg-white/10 text-black font-black rounded-[16px] sm:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payments List */}
                                    {payments.length > 0 && (
                                        <div className="space-y-3 animate-fade-in pb-4">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] sm:text-[11px] font-black text-text-muted uppercase tracking-widest">{t('floor.drawer.checkout.added_payments_label')}</p>
                                                <button onClick={() => setPayments([])} className="text-[10px] font-black text-red-400/60 hover:text-red-400 uppercase tracking-tighter transition-colors">{t('floor.drawer.checkout.clear_all')}</button>
                                            </div>
                                            <div className="grid gap-2">
                                                {payments.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 sm:p-4 rounded-[16px] sm:rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 sm:size-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-[18px] sm:text-[22px] text-white/60">
                                                                    {p.method === 'dinheiro' ? 'payments' : p.method === 'pix' ? 'qr_code_2' : 'credit_card'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-white text-[12px] sm:text-sm font-black uppercase tracking-tight">
                                                                    {t(`floor.drawer.methods.${p.method}`)}
                                                                </span>
                                                                <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                                                                    {t('floor.drawer.checkout.payment_added')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <span className="text-base sm:text-lg font-black text-white">{formatCurrency(p.amount)}</span>
                                                            <button
                                                                onClick={() => setPayments(prev => prev.filter(x => x.id !== p.id))}
                                                                className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar - Fixed at bottom */}
                                <div className="p-4 sm:p-8 pt-2 sm:pt-4 bg-white/[0.04] sm:bg-white/[0.02] border-t border-white/10 flex flex-col gap-2 sm:gap-3 shrink-0 pb-safe">
                                    <div className="flex gap-2 sm:gap-3">
                                        <button
                                            onClick={() => window.print()}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 rounded-[16px] sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-bold transition-all border border-white/5 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">print</span>
                                            <span>{t('floor.drawer.checkout.print_check')}</span>
                                        </button>
                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut || payments.reduce((s, p) => s + p.amount, 0) < tableTotal - 0.01}
                                            className="flex-[2] py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 disabled:bg-white/20 text-black font-black rounded-[16px] sm:rounded-2xl transition-all shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98]"
                                        >
                                            {checkingOut ? (
                                                <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">check_circle</span>
                                                    <span className="text-sm sm:text-base tracking-tight">{t('floor.drawer.checkout.finish_table')}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {payments.reduce((s, p) => s + p.amount, 0) < tableTotal - 0.01 && (
                                        <p className="text-center text-[9px] sm:text-[10px] font-bold text-orange-400/80 uppercase tracking-widest animate-pulse">
                                            {t('floor.drawer.checkout.missing_amount', { amount: formatCurrency(tableTotal - payments.reduce((s, p) => s + p.amount, 0)) })}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Full-Screen PIX QR Code Overlay ── */}
            {isQrFullscreen && pixQrCodeBase64 && (
                <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in-scale">
                    {/* Close Button */}
                    <button
                        onClick={() => setIsQrFullscreen(false)}
                        className="absolute top-4 right-4 size-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 z-10"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>

                    {/* Title */}
                    <div className="text-center mb-6 shrink-0">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-amber-400 text-2xl animate-pulse">qr_code_scanner</span>
                            {t('floor.drawer.pix.title')}
                        </h3>
                        <p className="text-sm text-text-muted mt-1">
                            {t('floor.drawer.pix.fullscreenHint')}
                        </p>
                    </div>

                    {/* QR Code — Maximum size, perfectly square */}
                    <div className="w-full max-w-[280px] aspect-square bg-white p-4 rounded-3xl shadow-2xl animate-scale-in select-none">
                        <img
                            src={`data:image/png;base64,${pixQrCodeBase64}`}
                            alt="PIX QR Code"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    {/* Amount & Countdown */}
                    <div className="text-center mt-6 space-y-2 shrink-0">
                        <p className="text-lg font-black text-white">
                            {t('floor.drawer.pix.remainingAmount').replace(':amount', formatCurrency(pixAmount))}
                        </p>
                        {!pixApproved && !pixError && !generatingPix && (
                            <p className="text-sm font-bold text-amber-400 tracking-wider">
                                {t('floor.drawer.pix.countdown').replace(':time', formatCountdown(pixCountdown))}
                            </p>
                        )}
                    </div>

                    {/* Copy & Waiting Status */}
                    <div className="w-full max-w-sm mt-6 space-y-3 shrink-0">
                        <button
                            onClick={handleCopyCode}
                            className={`w-full py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                copied
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            <span>{copied ? t('floor.drawer.pix.pixCopiar') + ' (Copiado!)' : t('floor.drawer.pix.pixCopiar')}</span>
                        </button>

                        <div className="flex items-center justify-center gap-2 bg-amber-500/5 border border-amber-500/10 py-2.5 px-4 rounded-xl">
                            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                {t('floor.drawer.pix.waitingApproval')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Container for the Receipt */}
            <ReceiptPrint order={activeOrder} />
        </>
    );
}
