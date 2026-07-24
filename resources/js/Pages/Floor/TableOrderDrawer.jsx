import { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import CustomNumberInput from '@/Components/CustomNumberInput';
import CheckoutModal from './components/Checkout/CheckoutModal';
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
                                const isExclusion = String(note || '').toLowerCase().startsWith('sem ') || String(note || '').toLowerCase().startsWith('retirar ') || String(note || '').toLowerCase().startsWith('no ');
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

    const handleCheckout = async (paymentsToSend = payments, extras = {}) => {
        const safePayments = Array.isArray(paymentsToSend) 
            ? paymentsToSend 
            : Object.values(paymentsToSend || {});

        if (!activeOrder || safePayments.length === 0) return;
        setCheckingOut(true);

        router.post(`/floor/${table.id}/pay`, {
            payments: safePayments
                .filter(p => p !== null && p !== undefined && p.method)
                .map(p => ({ 
                    method: p.method, 
                    amount: Math.round(Number(p.amount) * 100) 
                })),
            ...extras
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
            },
            onFinish: () => {
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

            {showCheckoutModal && activeOrder && (
                <CheckoutModal
                    activeOrders={activeOrders}
                    payments={payments}
                    setPayments={setPayments}
                    checkoutPaymentMethod={checkoutPaymentMethod}
                    setCheckoutPaymentMethod={setCheckoutPaymentMethod}
                    paymentInputValue={paymentInputValue}
                    setPaymentInputValue={setPaymentInputValue}
                    handleCheckout={handleCheckout}
                    checkingOut={checkingOut}
                    onClose={() => setShowCheckoutModal(false)}
                    generatePixPayment={generatePixPayment}
                    formatCurrency={formatCurrency}
                    t={t}
                    generatingPix={generatingPix}
                    pixQrCode={pixQrCode}
                    pixQrCodeBase64={pixQrCodeBase64}
                    pixAmount={pixAmount}
                    pixCountdown={pixCountdown}
                    pixApproved={pixApproved}
                    pixError={pixError}
                    setIsQrFullscreen={setIsQrFullscreen}
                    handleCopyCode={handleCopyCode}
                    copied={copied}
                    stopPixTracking={stopPixTracking}
                    formatCountdown={formatCountdown}
                />
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
