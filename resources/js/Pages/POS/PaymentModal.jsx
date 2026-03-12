import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const PAYMENT_METHODS = [
    { method: 'credito', icon: 'credit_card', label: 'Cartão Crédito' },
    { method: 'debito', icon: 'credit_card', label: 'Cartão Débito' },
    { method: 'dinheiro', icon: 'payments', label: 'Dinheiro' },
    { method: 'pix', icon: 'qr_code_2', label: 'Pix' },
];

export default function PaymentModal({ isOpen, onClose, onConfirm, total }) {
    const [payments, setPayments] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    // Customer fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [isReturning, setIsReturning] = useState(false);
    const [nameLocked, setNameLocked] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingName, setSearchingName] = useState(false);
    const [searchingPhone, setSearchingPhone] = useState(false);
    const nameDebounceRef = useRef(null);
    const phoneDebounceRef = useRef(null);
    const nameInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPayments([]);
            setSelectedMethod(null);
            setInputValue('');
            setCustomerName('');
            setCustomerPhone('');
            setIsReturning(false);
            setNameLocked(false);
            setSuggestions([]);
            setShowSuggestions(false);
            setSearchingName(false);
            setSearchingPhone(false);
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Click outside dropdown to close
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                nameInputRef.current && !nameInputRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-focus the input when a method is selected
    useEffect(() => {
        if (selectedMethod && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [selectedMethod]);

    if (!isOpen) return null;

    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    // Phone mask: (99) 99999-9999
    const formatPhone = (value) => {
        const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
        if (digits.length === 0) return '';
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    // ── Name field change: search by name ──
    const handleNameChange = (e) => {
        const val = e.target.value;
        setCustomerName(val);

        if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);

        if (val.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setSearchingName(true);
        nameDebounceRef.current = setTimeout(async () => {
            try {
                const res = await axios.get('/api/customers/search', { params: { query: val.trim() } });
                setSuggestions(res.data.customers || []);
                setShowSuggestions((res.data.customers || []).length > 0);
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
            setSearchingName(false);
        }, 350);
    };

    // ── Select a customer from the dropdown ──
    const selectCustomer = (c) => {
        setCustomerName(c.name);
        setCustomerPhone(c.phone ? formatPhone(c.phone) : '');
        setIsReturning(true);
        setNameLocked(true);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // ── Phone field change: search by phone ──
    const handlePhoneChange = (e) => {
        const raw = e.target.value;
        const formatted = formatPhone(raw);
        setCustomerPhone(formatted);

        if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 11) {
            setSearchingPhone(true);
            phoneDebounceRef.current = setTimeout(async () => {
                try {
                    const res = await axios.get('/api/customers/search', { params: { query: digits } });
                    if (res.data.found && res.data.customers?.length > 0) {
                        const c = res.data.customers[0];
                        setCustomerName(c.name);
                        setIsReturning(true);
                        setNameLocked(true);
                    } else {
                        setIsReturning(false);
                        setNameLocked(false);
                    }
                } catch {
                    setIsReturning(false);
                    setNameLocked(false);
                }
                setSearchingPhone(false);
            }, 400);
        } else {
            setIsReturning(false);
            setNameLocked(false);
        }
    };

    // ── Clear customer selection ──
    const clearCustomer = () => {
        setCustomerName('');
        setCustomerPhone('');
        setIsReturning(false);
        setNameLocked(false);
        setSuggestions([]);
        setShowSuggestions(false);
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, total - totalPaid);
    const change = Math.max(0, totalPaid - total);
    const canFinalize = totalPaid >= total && payments.length > 0 && customerName.trim().length > 0;

    const selectMethod = (method) => {
        setSelectedMethod(method);
        // Default to remaining amount
        setInputValue(remaining > 0 ? remaining.toFixed(2) : '');
    };

    const addPayment = () => {
        if (!selectedMethod) return;
        const amount = parseFloat(inputValue);
        if (isNaN(amount) || amount <= 0) return;

        setPayments(prev => [...prev, {
            id: Date.now(),
            method: selectedMethod,
            label: PAYMENT_METHODS.find(m => m.method === selectedMethod)?.label || selectedMethod,
            amount,
        }]);

        setSelectedMethod(null);
        setInputValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPayment();
        }
    };

    const removePayment = (id) => {
        setPayments(prev => prev.filter(p => p.id !== id));
    };

    const quickFullPayment = (method) => {
        const label = PAYMENT_METHODS.find(m => m.method === method)?.label || method;
        setPayments([{ id: Date.now(), method, label, amount: total }]);
        setSelectedMethod(null);
        setInputValue('');
    };

    const handleConfirm = () => {
        if (!canFinalize) return;
        const rawDigits = customerPhone.replace(/\D/g, '');
        onConfirm(
            payments.map(({ method, amount }) => ({ method, amount })),
            customerName.trim(),
            rawDigits.length >= 10 ? rawDigits : null
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/85 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#14141A] w-full max-w-lg rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">point_of_sale</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Pagamento</h3>
                            <p className="text-xs text-text-muted">Selecione um ou mais métodos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-5 flex-1">

                    {/* ── Customer Section ── */}
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            Identificação do Cliente
                        </p>
                        <div className="space-y-3">
                            {/* Customer Name + Autocomplete Dropdown */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                                <input
                                    ref={nameInputRef}
                                    type="text"
                                    value={customerName}
                                    onChange={handleNameChange}
                                    readOnly={nameLocked}
                                    placeholder="Nome do Cliente *"
                                    className={`w-full bg-surface border rounded-xl pl-10 pr-24 py-3 text-white text-sm font-medium placeholder:text-text-muted/50 focus:border-primary/50 outline-none transition-all ${nameLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border-subtle'
                                        }`}
                                />
                                {searchingName && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                                        <span className="material-symbols-outlined text-[18px]">progress_activity</span>
                                    </span>
                                )}
                                {isReturning && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                                            Recorrente
                                        </span>
                                        <button onClick={clearCustomer} className="text-text-muted hover:text-red-400 transition-colors" title="Limpar cliente">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                )}

                                {/* Dropdown Suggestions */}
                                {showSuggestions && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute left-0 right-0 top-full mt-1 bg-[#1A1A24] border border-border-subtle rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden max-h-60 overflow-y-auto"
                                    >
                                        {suggestions.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors flex items-center justify-between group border-b border-border-subtle/50 last:border-0"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.name}</p>
                                                        <p className="text-text-muted text-xs">
                                                            {c.phone ? formatPhone(c.phone) : 'Sem celular'}
                                                            {c.orders_count > 0 && (
                                                                <span className="text-emerald-400 ml-2">• {c.orders_count} pedido{c.orders_count > 1 ? 's' : ''}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-text-muted text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Customer Phone */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">call</span>
                                <input
                                    type="text"
                                    value={customerPhone}
                                    onChange={handlePhoneChange}
                                    readOnly={nameLocked}
                                    placeholder="Celular (opcional)"
                                    className={`w-full bg-surface border rounded-xl pl-10 pr-10 py-3 text-white text-sm font-medium placeholder:text-text-muted/50 focus:border-primary/50 outline-none transition-all ${nameLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border-subtle'
                                        }`}
                                />
                                {searchingPhone && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                                        <span className="material-symbols-outlined text-[18px]">progress_activity</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Total do Pedido */}
                    <div className="bg-black/40 border border-border-subtle rounded-xl p-4 flex justify-between items-center">
                        <span className="text-text-muted text-sm font-bold uppercase tracking-wider">Total do Pedido</span>
                        <span className="text-2xl font-black text-white font-mono">{formatBRL(total)}</span>
                    </div>

                    {/* Quick Payment Buttons */}
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">Pagamento Rápido (Valor Total)</p>
                        <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map(pm => (
                                <button
                                    key={pm.method}
                                    onClick={() => quickFullPayment(pm.method)}
                                    className="py-3 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1.5 bg-surface hover:bg-surface-hover text-white border border-transparent hover:border-primary/30 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[22px]">{pm.icon}</span>
                                    {pm.label.split(' ').pop()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Split Payment Section */}
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">Dividir Pagamento</p>

                        {/* Method Selection Row */}
                        <div className="flex gap-2 mb-3">
                            {PAYMENT_METHODS.map(pm => (
                                <button
                                    key={pm.method}
                                    onClick={() => selectMethod(pm.method)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${selectedMethod === pm.method
                                        ? 'bg-primary/20 text-primary border border-primary/40 shadow-lg shadow-primary/10'
                                        : 'bg-surface hover:bg-surface-hover text-text-muted border border-transparent'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                                    {pm.label.split(' ').pop()}
                                </button>
                            ))}
                        </div>

                        {/* Amount Input — visible when a method is selected  */}
                        {selectedMethod && (
                            <div className="flex gap-2 animate-in fade-in">
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">R$</span>
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-white font-mono font-bold text-lg focus:border-primary/50 outline-none transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                                <button
                                    onClick={addPayment}
                                    disabled={!inputValue || parseFloat(inputValue) <= 0}
                                    className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Adicionar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Added Payments List */}
                    {payments.length > 0 && (
                        <div>
                            <p className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">Pagamentos Adicionados</p>
                            <div className="space-y-2">
                                {payments.map(p => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border-subtle group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-[20px]">
                                                {PAYMENT_METHODS.find(m => m.method === p.method)?.icon || 'payments'}
                                            </span>
                                            <span className="text-white font-semibold text-sm">{p.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-emerald-400 font-mono font-bold">{formatBRL(p.amount)}</span>
                                            <button
                                                onClick={() => removePayment(p.id)}
                                                className="text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer — Summary + Confirm */}
                <div className="p-5 border-t border-border-subtle bg-[#111118] space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                            <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">Valor Restante</span>
                            <span className={`text-xl font-black font-mono ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {formatBRL(remaining)}
                            </span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-3 text-center border border-border-subtle">
                            <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold block mb-1">Troco</span>
                            <span className={`text-xl font-black font-mono ${change > 0 ? 'text-primary' : 'text-text-muted'}`}>
                                {formatBRL(change)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!canFinalize}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${canFinalize
                            ? 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25'
                            : 'bg-surface text-text-muted cursor-not-allowed border border-border-subtle'
                            }`}
                    >
                        {canFinalize ? (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                Finalizar Venda
                            </>
                        ) : customerName.trim().length === 0 ? (
                            <>
                                <span className="material-symbols-outlined">person_off</span>
                                Informe o nome do cliente
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">lock</span>
                                Informe o valor restante
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
