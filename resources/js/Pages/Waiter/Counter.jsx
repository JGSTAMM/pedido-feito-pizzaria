import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import MobileLayout from '@/Layouts/MobileLayout';
import CustomNumberInput from '@/Components/CustomNumberInput';
import PizzaBuilderModal from '@/Pages/POS/PizzaBuilderModal';
import ProductVariationModal from '@/Pages/POS/ProductVariationModal';
import { norm } from '@/utils/normalize';

const COUNTER_PAYMENT_METHODS = [
    { method: 'dinheiro', icon: 'payments', label: 'Dinheiro' },
    { method: 'pix', icon: 'currency_exchange', label: 'Pix (Por Fora)' },
    { method: 'credito', icon: 'credit_card', label: 'Crédito' },
    { method: 'debito', icon: 'credit_card', label: 'Débito' },
];

export default function Counter({
    products = [],
    pizzaFlavors = [],
    pizzaSizes = [],
    categories = [],
    borderOptions = [],
    cashRegisterOpen = true,
    userName = 'Garçom',
}) {
    const { flash } = usePage().props;

    // Catalog state
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Pizza Builder / Variations / Quick observation state
    const [showPizzaBuilder, setShowPizzaBuilder] = useState(false);
    const [initialPizzaFlavor, setInitialPizzaFlavor] = useState(null);
    const [showVariationModal, setShowVariationModal] = useState(false);
    const [productToVariate, setProductToVariate] = useState(null);
    const [selectedQuickItem, setSelectedQuickItem] = useState(null);
    const [quickObservation, setQuickObservation] = useState('');

    // Checkout sheet state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [payNow, setPayNow] = useState(true);
    const [payments, setPayments] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('dinheiro');
    const [paymentInputValue, setPaymentInputValue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const searchDebounceRef = useRef(null);

    const allCatalogItems = useMemo(() => [...pizzaFlavors, ...products], [pizzaFlavors, products]);

    const filteredItems = useMemo(() => {
        let items = allCatalogItems;
        if (activeCategory) {
            items = items.filter((item) => item.category === activeCategory);
        }
        if (searchTerm.trim()) {
            const term = norm(searchTerm);
            items = items.filter((item) => norm(item.name).includes(term));
        }
        return items;
    }, [allCatalogItems, activeCategory, searchTerm]);

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
        [cart]
    );
    const totalPaid = useMemo(
        () => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        [payments]
    );
    const remaining = Math.max(0, Number((cartTotal - totalPaid).toFixed(2)));
    const change = Math.max(0, Number((totalPaid - cartTotal).toFixed(2)));

    // Keep payment input auto-prefilled when remaining balance changes
    useEffect(() => {
        if (!isCheckoutOpen || !payNow) return;
        if (remaining > 0 && (!paymentInputValue || parseFloat(paymentInputValue) === 0)) {
            setPaymentInputValue(remaining.toFixed(2));
        }
    }, [isCheckoutOpen, payNow, remaining]);

    const formatBRL = (val) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`;

    const formatPhone = (value) => {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
        if (digits.length === 0) return '';
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const handleCatalogItemClick = (item) => {
        if (item.type === 'pizza_flavor') {
            setInitialPizzaFlavor(item);
            setShowPizzaBuilder(true);
            return;
        }

        let variations = item.variations;
        if (typeof variations === 'string') {
            try { variations = JSON.parse(variations); } catch { variations = []; }
        }
        if (Array.isArray(variations) && variations.length > 0) {
            setProductToVariate({ ...item, variations });
            setShowVariationModal(true);
            return;
        }

        setSelectedQuickItem(item);
        setQuickObservation('');
    };

    const confirmQuickItem = () => {
        if (!selectedQuickItem) return;
        const obs = quickObservation.trim();
        const key = `${selectedQuickItem.type}_${selectedQuickItem.id}_${obs || 'plain'}`;

        setCart((prev) => {
            const existing = prev.find((c) => c.key === key);
            if (existing) {
                return prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + 1 } : c));
            }
            return [
                ...prev,
                {
                    key,
                    id: selectedQuickItem.id,
                    type: selectedQuickItem.type,
                    name: selectedQuickItem.name,
                    price: Number(selectedQuickItem.price),
                    quantity: 1,
                    category: selectedQuickItem.category,
                    observation: obs || null,
                },
            ];
        });

        setSelectedQuickItem(null);
        setQuickObservation('');
    };

    const handleVariationConfirm = (product, variation, extraObs = '') => {
        const variationNote = variation.name;
        const key = `${product.type}_${product.id}_var_${variation.name}`;

        setCart((prev) => {
            const existing = prev.find((c) => c.key === key);
            if (existing) {
                return prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + 1 } : c));
            }
            return [
                ...prev,
                {
                    key,
                    id: product.id,
                    type: product.type,
                    name: `${product.name} (${variation.name})`,
                    price: Number(variation.price),
                    quantity: 1,
                    category: product.category,
                    observation: variationNote,
                    extraObs: extraObs || null,
                },
            ];
        });

        setShowVariationModal(false);
        setProductToVariate(null);
    };

    const updateQty = (key, delta) => {
        setCart((prev) =>
            prev
                .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
                .filter((item) => item.quantity > 0)
        );
    };

    const handleNameChange = (value) => {
        setCustomerName(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        if (value.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get('/api/customers/search', { params: { query: value.trim() } });
                const list = res.data?.customers || [];
                setSuggestions(list);
                setShowSuggestions(list.length > 0);
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
    };

    const handlePhoneChange = (value) => {
        const formatted = formatPhone(value);
        setCustomerPhone(formatted);

        const digits = value.replace(/\D/g, '');
        if (digits.length >= 11) {
            axios
                .get('/api/customers/search', { params: { query: digits } })
                .then((res) => {
                    if (res.data?.found && res.data?.customers?.length > 0) {
                        setCustomerName(res.data.customers[0].name);
                    }
                })
                .catch(() => {});
        }
    };

    const quickFullPayment = (method) => {
        const meta = COUNTER_PAYMENT_METHODS.find((m) => m.method === method);
        setPayments([{ id: Date.now(), method, label: meta?.label || method, amount: cartTotal }]);
        setSelectedMethod(method);
        setPaymentInputValue('');
    };

    const addSplitPayment = () => {
        const amount = parseFloat(paymentInputValue);
        if (!selectedMethod || isNaN(amount) || amount <= 0) return;

        const meta = COUNTER_PAYMENT_METHODS.find((m) => m.method === selectedMethod);
        setPayments((prev) => [
            ...prev,
            { id: Date.now(), method: selectedMethod, label: meta?.label || selectedMethod, amount },
        ]);
        setPaymentInputValue('');
    };

    const canSubmit =
        cashRegisterOpen &&
        cart.length > 0 &&
        customerName.trim().length > 0 &&
        (!payNow || (payments.length > 0 && totalPaid >= cartTotal - 0.01)) &&
        !submitting;

    const handleSubmitOrder = () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError('');

        const rawDigits = customerPhone.replace(/\D/g, '');

        router.post(
            '/waiter/counter/order',
            {
                items: cart.map((item) => {
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
                customer_name: customerName.trim(),
                customer_phone: rawDigits.length >= 10 ? rawDigits : null,
                pay_now: payNow,
                payments: payNow
                    ? payments.map((p) => ({ method: p.method, amount: Number(p.amount) }))
                    : [],
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCart([]);
                    setPayments([]);
                    setCustomerName('');
                    setCustomerPhone('');
                    setIsCheckoutOpen(false);
                    setSubmitting(false);
                },
                onError: (errors) => {
                    setSubmitError(Object.values(errors || {})[0] || 'Erro ao lançar pedido balcão.');
                    setSubmitting(false);
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <>
            <MobileLayout activeTab="/waiter/counter">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-background-dark/95 backdrop-blur-xl border-b border-border-subtle px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[22px]">storefront</span>
                            </div>
                            <div>
                                <h1 className="text-white text-xl font-black tracking-tight">Venda Balcão</h1>
                                <p className="text-text-muted text-xs font-medium">
                                    Operador: {userName.split(' ')[0]}
                                </p>
                            </div>
                        </div>

                        <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                cashRegisterOpen
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}
                        >
                            {cashRegisterOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar produto ou sabor..."
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                        <button
                            type="button"
                            onClick={() => setActiveCategory(null)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                !activeCategory
                                    ? 'bg-primary/20 text-primary border-primary/35'
                                    : 'bg-surface text-text-muted border-border-subtle'
                            }`}
                        >
                            Todos
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    activeCategory === cat
                                        ? 'bg-primary/20 text-primary border-primary/35'
                                        : 'bg-surface text-text-muted border-border-subtle'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 py-4 space-y-4 pb-28">
                    {!cashRegisterOpen && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-400 shrink-0">lock_clock</span>
                            <div>
                                <p className="text-red-300 font-bold text-sm">Caixa Fechado</p>
                                <p className="text-red-200/80 text-xs mt-0.5">
                                    Solicite a abertura do caixa no painel antes de registrar vendas no balcão.
                                </p>
                            </div>
                        </div>
                    )}

                    {flash?.success && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Montar Pizza CTA */}
                    {(activeCategory === 'Pizzas' || activeCategory === null) && (
                        <button
                            type="button"
                            onClick={() => {
                                setInitialPizzaFlavor(null);
                                setShowPizzaBuilder(true);
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/15 to-[#06b6d4]/15 border border-primary/35 rounded-2xl active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center gap-3.5 text-left">
                                <div className="size-11 bg-primary/25 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined text-[24px]">local_pizza</span>
                                </div>
                                <div>
                                    <p className="text-white font-black text-base leading-tight">Montar Pizza</p>
                                    <p className="text-text-muted text-xs mt-0.5">Escolha tamanho, sabores e borda</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-primary">arrow_forward</span>
                        </button>
                    )}

                    {/* Catalog Items */}
                    <div className="space-y-2.5">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-12 bg-surface border border-border-subtle rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-text-muted/50 mb-2">search_off</span>
                                <p className="text-text-muted text-sm">Nenhum item encontrado</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <button
                                    key={`${item.type}_${item.id}`}
                                    type="button"
                                    onClick={() => handleCatalogItemClick(item)}
                                    className="w-full flex items-center gap-3.5 p-3.5 bg-surface hover:bg-surface-hover rounded-2xl border border-border-subtle transition-all text-left active:scale-[0.98]"
                                >
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{item.name}</p>
                                        <p className="text-text-muted text-xs">{item.category}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                                        <span className="text-xs font-bold text-emerald-400 font-mono">
                                            {formatBRL(item.price)}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </MobileLayout>

            {/* Floating Cart Button */}
            {cart.length > 0 && !isCheckoutOpen && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40">
                    <button
                        type="button"
                        onClick={() => {
                            setPayments([]);
                            setPaymentInputValue(cartTotal > 0 ? cartTotal.toFixed(2) : '');
                            setSubmitError('');
                            setIsCheckoutOpen(true);
                        }}
                        className="w-full bg-gradient-to-r from-primary to-[#06b6d4] text-white p-3.5 px-4 rounded-2xl shadow-[0_10px_35px_rgba(139,92,246,0.45)] border border-white/20 flex items-center justify-between active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-black/25 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                            </div>
                            <div className="text-left">
                                <p className="font-black text-sm">
                                    {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
                                </p>
                                <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Finalizar Balcão</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-black text-base font-mono">
                            <span>{formatBRL(cartTotal)}</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Fullscreen Mobile Counter Checkout Sheet */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#120F1D] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border-subtle bg-surface flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-lg font-black text-white leading-tight">Finalizar Venda Balcão</h2>
                            <p className="text-xs text-text-muted">Total: {formatBRL(cartTotal)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="size-9 rounded-xl bg-white/5 text-text-muted hover:text-white flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined">keyboard_arrow_down</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        {/* Cart Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Itens do Pedido
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCart([]);
                                        setIsCheckoutOpen(false);
                                    }}
                                    className="text-[10px] font-bold text-red-400 uppercase"
                                >
                                    Limpar Carrinho
                                </button>
                            </div>
                            {cart.map((item) => (
                                <div key={item.key} className="bg-surface border border-border-subtle rounded-xl p-3 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                        {item.description && (
                                            <p className="text-xs text-primary/90 leading-snug">{item.description}</p>
                                        )}
                                        {item.observation && (
                                            <p className="text-[11px] text-amber-400/80 mt-0.5 break-words">{item.observation}</p>
                                        )}
                                        <p className="text-xs font-bold text-emerald-400 font-mono mt-1">
                                            {formatBRL(item.price * item.quantity)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.key, -1)}
                                            className="size-8 rounded-lg bg-white/5 text-white flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <span className="w-5 text-center text-xs font-black text-white">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateQty(item.key, 1)}
                                            className="size-8 rounded-lg bg-white/5 text-white flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-2.5 bg-surface border border-border-subtle rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                    Cliente *
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerName('Cliente Balcão');
                                        setShowSuggestions(false);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold"
                                >
                                    Usar "Cliente Balcão"
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Nome do cliente *"
                                    className="w-full bg-background-dark border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#1A1A24] border border-border-subtle rounded-xl shadow-2xl z-50 max-h-44 overflow-y-auto">
                                        {suggestions.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => {
                                                    setCustomerName(c.name);
                                                    setCustomerPhone(c.phone ? formatPhone(c.phone) : '');
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full px-3.5 py-2.5 text-left hover:bg-primary/10 border-b border-white/5 last:border-0 flex items-center justify-between"
                                            >
                                                <span className="text-sm font-bold text-white">{c.name}</span>
                                                <span className="text-xs text-text-muted">{c.phone ? formatPhone(c.phone) : ''}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="Celular / WhatsApp (opcional)"
                                className="w-full bg-background-dark border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Payment Mode Toggle: Receber Agora vs Enviar p/ Caixa */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block">
                                Forma de Recebimento
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPayNow(true)}
                                    className={`p-3 rounded-2xl border text-left transition-all ${
                                        payNow
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                                            : 'bg-surface border-border-subtle text-text-muted'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-400">payments</span>
                                        <span className="text-xs font-black uppercase">Receber Agora</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted leading-tight">
                                        Garçom recebe no balcão/maquininha
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPayNow(false);
                                        setPayments([]);
                                    }}
                                    className={`p-3 rounded-2xl border text-left transition-all ${
                                        !payNow
                                            ? 'bg-amber-500/15 border-amber-500/40 text-white'
                                            : 'bg-surface border-border-subtle text-text-muted'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="material-symbols-outlined text-[18px] text-amber-400">point_of_sale</span>
                                        <span className="text-xs font-black uppercase">Enviar p/ Caixa</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted leading-tight">
                                        Produz na cozinha e paga depois
                                    </p>
                                </button>
                            </div>
                        </div>

                        {payNow ? (
                            <div className="space-y-4 bg-surface border border-border-subtle rounded-2xl p-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
                                        <span className="text-[9px] font-black text-text-muted uppercase block">Total</span>
                                        <span className="text-sm font-black text-white font-mono">{formatBRL(cartTotal)}</span>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
                                        <span className="text-[9px] font-black text-orange-400 uppercase block">Restante</span>
                                        <span className="text-sm font-black text-orange-300 font-mono">{formatBRL(remaining)}</span>
                                    </div>
                                    <div className="bg-black/30 rounded-xl p-2.5 text-center border border-white/5">
                                        <span className="text-[9px] font-black text-blue-400 uppercase block">Troco</span>
                                        <span className="text-sm font-black text-blue-300 font-mono">{formatBRL(change)}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                                        Toque rápido (Valor Total)
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {COUNTER_PAYMENT_METHODS.map((pm) => (
                                            <button
                                                key={pm.method}
                                                type="button"
                                                onClick={() => quickFullPayment(pm.method)}
                                                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-colors active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[18px] text-emerald-400">{pm.icon}</span>
                                                <span>{pm.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/5 space-y-2">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                                        Ou Dividir Pagamento
                                    </p>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {COUNTER_PAYMENT_METHODS.map((pm) => (
                                            <button
                                                key={pm.method}
                                                type="button"
                                                onClick={() => setSelectedMethod(pm.method)}
                                                className={`py-2 rounded-lg text-[10px] font-bold uppercase border ${
                                                    selectedMethod === pm.method
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-white'
                                                        : 'bg-black/20 border-white/5 text-text-muted'
                                                }`}
                                            >
                                                {pm.label.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <CustomNumberInput
                                            value={paymentInputValue}
                                            onChange={(val) => setPaymentInputValue(val)}
                                            prefix="R$"
                                            step={0.01}
                                            min={0.01}
                                            placeholder="0,00"
                                            className="w-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSplitPayment}
                                            disabled={!paymentInputValue || parseFloat(paymentInputValue) <= 0}
                                            className="px-4 bg-emerald-500 disabled:opacity-30 text-black font-black rounded-xl flex items-center justify-center shrink-0"
                                        >
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </div>
                                </div>

                                {payments.length > 0 && (
                                    <div className="space-y-1.5">
                                        {payments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                                                <span className="text-xs font-bold text-white uppercase">{p.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-emerald-400 font-mono">{formatBRL(p.amount)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPayments((prev) => prev.filter((item) => item.id !== p.id))}
                                                        className="text-text-muted hover:text-red-400"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-amber-400 shrink-0">info</span>
                                <span>
                                    O pedido será enviado para a cozinha/KDS imediatamente e ficará como <strong>Pagar no Caixa</strong> nas telas de Comandas e Pedidos até o recebimento.
                                </span>
                            </div>
                        )}

                        {submitError && (
                            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold">
                                {submitError}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-border-subtle bg-surface shrink-0">
                        <button
                            type="button"
                            onClick={handleSubmitOrder}
                            disabled={!canSubmit}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-[#06b6d4] disabled:opacity-40 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {payNow ? 'check_circle' : 'send'}
                            </span>
                            <span>
                                {submitting
                                    ? 'Enviando...'
                                    : payNow
                                        ? `Finalizar e Imprimir (${formatBRL(cartTotal)})`
                                        : `Enviar p/ Cozinha e Caixa (${formatBRL(cartTotal)})`}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Quick Observation Modal */}
            {selectedQuickItem && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedQuickItem(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[#120F1D] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl"
                    >
                        <div>
                            <h3 className="text-lg font-black text-white">{selectedQuickItem.name}</h3>
                            <p className="text-emerald-400 font-bold text-sm font-mono">{formatBRL(selectedQuickItem.price)}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-text-muted block mb-1.5">Observação (Opcional)</label>
                            <textarea
                                rows={2}
                                value={quickObservation}
                                onChange={(e) => setQuickObservation(e.target.value)}
                                placeholder="Ex: Bem gelada, sem gelo e limão..."
                                className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50 resize-none"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedQuickItem(null)}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmQuickItem}
                                className="flex-[2] py-3 rounded-xl bg-primary text-white font-black text-sm"
                            >
                                Adicionar ao Balcão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pizza Builder Modal */}
            {showPizzaBuilder && (
                <PizzaBuilderModal
                    isOpen={showPizzaBuilder}
                    onClose={() => {
                        setShowPizzaBuilder(false);
                        setInitialPizzaFlavor(null);
                    }}
                    onConfirm={(pizzaItem) => {
                        setCart((prev) => [...prev, pizzaItem]);
                        setShowPizzaBuilder(false);
                        setInitialPizzaFlavor(null);
                    }}
                    pizzaFlavors={pizzaFlavors}
                    pizzaSizes={pizzaSizes}
                    borderOptions={borderOptions}
                    initialFlavor={initialPizzaFlavor}
                />
            )}

            {/* Product Variation Modal */}
            {showVariationModal && productToVariate && (
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
        </>
    );
}
