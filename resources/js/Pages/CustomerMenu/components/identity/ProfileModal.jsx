import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDigitalMenuQuery } from '../../hooks/useDigitalMenuQuery';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';
import useI18n from '@/hooks/useI18n';

export default function ProfileModal({ isOpen, onClose, onSuccess, customer }) {
    const [name, setName] = useState(customer?.name || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { t } = useI18n();

    const { data } = useDigitalMenuQuery();
    const neighborhoods = data?.neighborhoods ?? [];

    const [view, setView] = useState('main'); // 'main' or 'add_address'
    const [isNeighDropdownOpen, setIsNeighDropdownOpen] = useState(false);

    // Addresses state
    const [addresses, setAddresses] = useState(() => {
        try {
            const saved = localStorage.getItem('customerAddresses');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [selectedAddressId, setSelectedAddressId] = useState(() => {
        return localStorage.getItem('selectedAddressId') || null;
    });

    const [newAddress, setNewAddress] = useState({
        id: '',
        street: '',
        number: '',
        neighborhoodId: '',
        complement: ''
    });

    useEffect(() => {
        if (customer) {
            setName(customer.name || '');
            setPhone(customer.phone || '');
        }
    }, [customer]);

    if (!isOpen) return null;

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 7) {
            formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        }

        setPhone(formatted);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (name.trim().length < 3) {
            setError(t('digital_menu.profile.errors.name_required'));
            return;
        }

        const plainPhone = phone.replace(/\D/g, '');
        if (plainPhone.length < 10) {
            setError(t('digital_menu.profile.errors.phone_invalid'));
            return;
        }

        setIsLoading(true);

        try {
            const { data } = await axios.post('/api/customers/identify', {
                phone: plainPhone,
                name: name.trim()
            });

            if (data.found || data.created) {
                const updatedCustomer = {
                    ...data.customer,
                    addresses: addresses
                };
                localStorage.setItem('customerIdentity', JSON.stringify(updatedCustomer));
                setSuccess(true);
                setTimeout(() => {
                    onSuccess(updatedCustomer);
                }, 1000);
            } else {
                setError(t('digital_menu.profile.errors.update_failed'));
            }
        } catch (err) {
            setError(t('digital_menu.profile.errors.generic_save_error'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAddress = (e) => {
        e.preventDefault();
        if (!newAddress.street || !newAddress.number || !newAddress.neighborhoodId) {
            setError(t('digital_menu.profile.errors.address_required_fields'));
            return;
        }

        const selectedNeigh = neighborhoods.find(n => String(n.id) === String(newAddress.neighborhoodId));

        const addressWithId = {
            ...newAddress,
            neighborhood: selectedNeigh?.name || '',
            id: Date.now().toString(),
        };

        const updatedAddresses = [...addresses, addressWithId];
        setAddresses(updatedAddresses);
        localStorage.setItem('customerAddresses', JSON.stringify(updatedAddresses));

        // Auto-select if it's the first one
        if (updatedAddresses.length === 1) {
            handleSelectAddress(addressWithId.id);
        }

        setNewAddress({ id: '', street: '', number: '', neighborhoodId: '', neighborhood: '', complement: '' });
        setError('');
    };

    const handleRemoveAddress = (id) => {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        localStorage.setItem('customerAddresses', JSON.stringify(updated));
        if (selectedAddressId === id) {
            const nextSelect = updated.length > 0 ? updated[0].id : null;
            setSelectedAddressId(nextSelect);
            if (nextSelect) localStorage.setItem('selectedAddressId', nextSelect);
            else localStorage.removeItem('selectedAddressId');
        }
    };

    const handleSelectAddress = (id) => {
        setSelectedAddressId(id);
        localStorage.setItem('selectedAddressId', id);
    };

    const handleLogout = () => {
        localStorage.removeItem('customerIdentity');
        localStorage.removeItem('customerAddresses');
        localStorage.removeItem('selectedAddressId');
        onSuccess(null);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className={`${luccheseMenuTheme.glass} w-full max-w-sm overflow-hidden rounded-3xl border border-white/5 flex flex-col max-h-[90vh] shadow-2xl bg-[#0D0D12]`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white italic tracking-tight">
                        {view === 'main' ? t('digital_menu.profile.title') : t('digital_menu.profile.new_address_title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white transition-colors hover:bg-white/10"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {view === 'main' ? (
                        <div className="space-y-8">
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px flex-1 bg-white/5"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{t('digital_menu.profile.personal_data_section')}</span>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-[10px] font-black uppercase text-text-muted ml-4">{t('digital_menu.profile.full_name_label')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t('digital_menu.profile.placeholders.full_name')}
                                        className="w-full rounded-full border border-white/5 bg-[#16161E] px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 placeholder:text-white/40 shadow-inner"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-[10px] font-black uppercase text-text-muted ml-4">{t('digital_menu.profile.whatsapp_label')}</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder={t('digital_menu.profile.placeholders.whatsapp')}
                                        className="w-full rounded-full border border-white/5 bg-[#16161E] px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/50 placeholder:text-white/40 shadow-inner"
                                    />
                                </div>

                                {error && view === 'main' && <p className="text-xs text-red-400 font-bold bg-red-400/10 p-3 rounded-xl">{error}</p>}
                                {success && <p className="text-xs text-emerald-400 font-bold bg-[#0A1A12] border border-emerald-500/20 p-4 rounded-3xl text-center">{t('digital_menu.profile.update_success')}</p>}

                                <button
                                    type="submit"
                                    disabled={isLoading || success}
                                    className={`w-full rounded-full py-4 font-black uppercase tracking-[0.15em] transition-all text-xs shadow-lg mt-2 ${isLoading || success
                                        ? 'bg-[#1E1B2A] text-white/50 cursor-not-allowed shadow-none'
                                        : 'bg-[#5a5af6] text-white hover:bg-[#4b4be5] hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {isLoading ? t('digital_menu.profile.updating') : t('digital_menu.profile.update_action')}
                                </button>
                            </form>

                            {/* Addresses Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4 mt-6">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{t('digital_menu.profile.saved_addresses_section')}</span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleSelectAddress(addr.id)}
                                            className={`relative rounded-2xl border p-4 transition-all group cursor-pointer ${selectedAddressId === addr.id
                                                ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/20 shadow-lg shadow-primary/5'
                                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 pr-8">
                                                    <p className="text-sm font-bold text-white truncate italic">
                                                        {addr.street}, {addr.number}
                                                    </p>
                                                    <p className="text-[10px] text-text-muted mt-0.5 uppercase font-bold tracking-wider">
                                                        {addr.neighborhood} {addr.complement && `• ${addr.complement}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveAddress(addr.id);
                                                    }}
                                                    className="absolute top-4 right-4 h-7 w-7 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400/20"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                            {selectedAddressId === addr.id && (
                                                <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-widest bg-primary/20 w-fit px-2 py-0.5 rounded-full border border-primary/20">
                                                    <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span>
                                                    {t('digital_menu.profile.default_badge')}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setView('add_address')}
                                        className="w-full rounded-full border border-dashed border-white/10 bg-white/[0.01] py-4 text-xs font-bold text-text-muted hover:text-white hover:bg-white/[0.04] transition-all uppercase tracking-widest mt-2"
                                    >
                                        + {t('digital_menu.profile.add_address_action')}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-8 mb-4">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full rounded-full border border-red-500/20 bg-[#160B0E] py-4 font-bold text-red-500 transition-all hover:bg-red-400/10 uppercase text-xs tracking-widest"
                                >
                                    {t('digital_menu.profile.logout_action')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="rounded-3xl bg-[#131118] p-6 shadow-2xl">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5a5af6] mb-8 italic text-center text-primary">{t('digital_menu.profile.create_address_section')}</h3>
                                <form onSubmit={(e) => {
                                    handleAddAddress(e);
                                    if (newAddress.street && newAddress.number && newAddress.neighborhoodId) {
                                        setView('main');
                                    }
                                }} className="space-y-5">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="mb-2 block text-[10px] font-black uppercase text-white/50 ml-4">{t('digital_menu.profile.street_label')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('digital_menu.profile.placeholders.street')}
                                                value={newAddress.street}
                                                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                className="w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-primary/50 placeholder:text-white/30 shadow-inner"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="mb-2 block text-[10px] font-black uppercase text-white/50 ml-4">{t('digital_menu.profile.number_label')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('digital_menu.profile.placeholders.number')}
                                                value={newAddress.number}
                                                onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                                                className="w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-primary/50 placeholder:text-white/30 shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="mb-2 block text-[10px] font-black uppercase text-white/50 ml-4">{t('digital_menu.profile.neighborhood_label')}</label>
                                        <div
                                            className={`w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-3.5 text-sm font-bold ${!newAddress.neighborhoodId ? 'text-white/50' : 'text-white'} shadow-inner flex items-center justify-between cursor-pointer`}
                                            onClick={() => setIsNeighDropdownOpen(!isNeighDropdownOpen)}
                                        >
                                            <span>
                                                {newAddress.neighborhoodId
                                                    ? neighborhoods.find(n => String(n.id) === String(newAddress.neighborhoodId))?.name
                                                    : t('digital_menu.profile.select_neighborhood_placeholder')}
                                            </span>
                                            <svg className={`h-4 w-4 text-white/50 transition-transform ${isNeighDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>

                                        {isNeighDropdownOpen && (
                                            <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1A24] py-2 shadow-xl custom-scrollbar">
                                                {neighborhoods.map(b => (
                                                    <div
                                                        key={b.id}
                                                        className="px-6 py-3 text-sm font-bold text-white hover:bg-white/5 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setNewAddress({ ...newAddress, neighborhoodId: b.id });
                                                            setIsNeighDropdownOpen(false);
                                                        }}
                                                    >
                                                        {b.name} <span className="text-text-muted text-xs font-normal ml-2">{b.delivery_fee ? `(+ ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.delivery_fee)})` : `(${t('digital_menu.profile.free_delivery')})`}</span>
                                                    </div>
                                                ))}
                                                {neighborhoods.length === 0 && (
                                                    <div className="px-6 py-3 text-sm text-white/50 italic">{t('digital_menu.profile.no_neighborhoods')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-[10px] font-black uppercase text-white/50 ml-4">{t('digital_menu.profile.complement_label')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('digital_menu.profile.placeholders.complement')}
                                            value={newAddress.complement}
                                            onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                                            className="w-full rounded-full border border-[#2A2A35] bg-[#16161E] px-6 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-primary/50 placeholder:text-white/30 shadow-inner"
                                        />
                                    </div>

                                    {error && view === 'add_address' && <p className="text-xs text-red-400 font-bold bg-red-400/5 p-3 rounded-xl border border-red-400/10 text-center">{error}</p>}

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setView('main'); setError(''); }}
                                            className="w-1/3 rounded-full border border-[#2A2A35] bg-transparent py-4 font-black text-white text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                                        >
                                            {t('digital_menu.profile.cancel_action')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="w-2/3 rounded-full bg-[#5a5af6] py-4 font-black text-white text-[10px] uppercase tracking-widest hover:bg-[#4b4be5] transition-all shadow-[0_4px_14px_rgba(90,90,246,0.3)]"
                                        >
                                            {t('digital_menu.profile.save_location_action')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
