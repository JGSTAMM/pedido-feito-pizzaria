import { useState, useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';

/* ── Tiny Modal Shell ── */
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#18181F] w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

/* ── Toast ── */
function Toast({ message, type = 'success' }) {
    if (!message) return null;
    const bg = type === 'success' ? 'bg-emerald-500/90' : 'bg-red-500/90';
    return (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-white text-sm font-bold shadow-lg ${bg} animate-[fadeIn_0.3s_ease-out]`}>
            {message}
        </div>
    );
}

/* ── TABS CONFIG ── */
const TABS = [
    { key: 'perfil', label: 'Perfil do Negócio', icon: 'storefront' },
    { key: 'impressoras', label: 'Impressoras', icon: 'print' },
    { key: 'integracoes', label: 'Integrações', icon: 'integration_instructions' },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function Index({ settings, printers = [] }) {
    const [activeTab, setActiveTab] = useState('perfil');
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (flash?.success) { setToast({ message: flash.success, type: 'success' }); }
        if (flash?.error) { setToast({ message: flash.error, type: 'error' }); }
    }, [flash]);

    useEffect(() => {
        if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
    }, [toast]);

    return (
        <AppLayout>
            <Toast message={toast?.message} type={toast?.type} />
            <div className="flex-1 overflow-y-auto">
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">settings</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Configurações</h2>
                            <p className="text-text-muted text-xs">Gestão técnica e dados do estabelecimento</p>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-6xl flex gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-64 flex-shrink-0 flex flex-col gap-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-left transition-all ${activeTab === tab.key ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-surface text-text-muted hover:text-white border border-transparent'}`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 space-y-6">
                        {activeTab === 'perfil' && <TabPerfil settings={settings} />}
                        {activeTab === 'impressoras' && <TabImpressoras printers={printers} />}
                        {activeTab === 'integracoes' && <TabIntegracoes />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB: PERFIL DO NEGÓCIO
   ═══════════════════════════════════════════════════════════════════ */
function TabPerfil({ settings }) {
    const [isSavingStatus, setIsSavingStatus] = useState(false);

    const profileForm = useForm({
        store_name: settings.store_name || '',
        cnpj: settings.cnpj || '',
    });

    const hoursForm = useForm({
        opening_hours: settings.opening_hours || {
            monday: { open: '18:00', close: '23:30', closed: false },
            tuesday: { open: '18:00', close: '23:30', closed: false },
            wednesday: { open: '18:00', close: '23:30', closed: false },
            thursday: { open: '18:00', close: '23:30', closed: false },
            friday: { open: '18:00', close: '00:00', closed: false },
            saturday: { open: '18:00', close: '00:00', closed: false },
            sunday: { open: '18:00', close: '23:30', closed: false },
        }
    });

    const toggleStoreStatus = () => {
        if (isSavingStatus) return;
        setIsSavingStatus(true);
        router.post('/settings/status', { is_open: !settings.is_open }, { preserveScroll: true, onFinish: () => setIsSavingStatus(false) });
    };

    const saveProfile = (e) => {
        e.preventDefault();
        profileForm.post('/settings/profile', { preserveScroll: true });
    };

    const saveHours = (e) => {
        e.preventDefault();
        hoursForm.post('/settings/hours', { preserveScroll: true });
    };

    const handleHourChange = (day, field, value) => {
        hoursForm.setData('opening_hours', {
            ...hoursForm.data.opening_hours,
            [day]: { ...hoursForm.data.opening_hours[day], [field]: field === 'closed' ? !hoursForm.data.opening_hours[day].closed : value }
        });
    };

    const days = {
        monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo'
    };

    return (
        <>
            {/* Store Status Toggle */}
            <Card>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Status da Loja</h3>
                        <p className="text-sm text-text-muted">Desligue para suspender canais de venda.</p>
                    </div>
                    <button
                        onClick={toggleStoreStatus}
                        disabled={isSavingStatus}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark ${settings.is_open ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'} ${isSavingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span aria-hidden="true" className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.is_open ? 'translate-x-3' : '-translate-x-3'}`} />
                    </button>
                </div>
            </Card>

            {/* Profile Form */}
            <Card>
                <h3 className="text-lg font-bold text-white mb-6">Informações Básicas</h3>
                <form onSubmit={saveProfile} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label>Nome do Estabelecimento</Label>
                            <input type="text" value={profileForm.data.store_name} onChange={e => profileForm.setData('store_name', e.target.value)} className="w-full bg-background-dark border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all" />
                        </div>
                        <div>
                            <Label>CNPJ</Label>
                            <input type="text" value={profileForm.data.cnpj} onChange={e => profileForm.setData('cnpj', e.target.value)} className="w-full bg-background-dark border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={profileForm.processing} className="px-5 py-2.5 bg-primary hover:bg-[#7C3AED] text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {profileForm.processing ? 'Salvando...' : 'Salvar Perfil'}
                        </button>
                    </div>
                </form>
            </Card>

            {/* Opening Hours */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Horários de Funcionamento</h3>
                        <p className="text-sm text-text-muted">Configure o expediente padrão da pizzaria.</p>
                    </div>
                    <button onClick={saveHours} disabled={hoursForm.processing} className="px-5 py-2.5 bg-primary hover:bg-[#7C3AED] text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {hoursForm.processing ? 'Salvando...' : 'Salvar Horários'}
                    </button>
                </div>
                <form onSubmit={saveHours} className="space-y-3">
                    {Object.entries(days).map(([dayKey, dayLabel]) => {
                        const d = hoursForm.data.opening_hours[dayKey];
                        return (
                            <div key={dayKey} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${d.closed ? 'bg-background-dark/50 border-white/5 opacity-60' : 'bg-background-dark border-border-subtle'}`}>
                                <div className="flex items-center gap-4 w-48">
                                    <button type="button" onClick={() => handleHourChange(dayKey, 'closed')} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${!d.closed ? 'bg-primary' : 'bg-surface-hover'}`}>
                                        <span className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!d.closed ? 'translate-x-2' : '-translate-x-2'}`} />
                                    </button>
                                    <span className="text-sm font-bold text-white">{dayLabel}</span>
                                </div>
                                <div className="flex items-center gap-6 flex-1 max-w-sm">
                                    {d.closed ? (
                                        <span className="text-sm font-bold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">Fechado</span>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-text-muted uppercase">Abre:</span>
                                                <input type="time" value={d.open} onChange={e => handleHourChange(dayKey, 'open', e.target.value)} className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-text-muted uppercase">Fecha:</span>
                                                <input type="time" value={d.close} onChange={e => handleHourChange(dayKey, 'close', e.target.value)} className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </form>
            </Card>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB: IMPRESSORAS
   ═══════════════════════════════════════════════════════════════════ */
function TabImpressoras({ printers }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({ name: '', type: 'receipt', target: 'cash_register', ip_address: '' });

    const openCreate = () => { clearErrors(); reset(); setEditingId(null); setModalOpen(true); };
    const openEdit = (p) => { clearErrors(); setData({ name: p.name, type: p.type, target: p.target, ip_address: p.ip_address || '' }); setEditingId(p.id); setModalOpen(true); };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/settings/printers/${editingId}`, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        } else {
            post('/settings/printers', { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const handleDelete = (id) => { if (confirm('Excluir esta impressora?')) router.delete(`/settings/printers/${id}`, { preserveScroll: true }); };

    const targetLabel = (t) => t === 'kitchen' ? 'Cozinha (Produção)' : 'Caixa (Recibo)';
    const typeLabel = (t) => t === 'production' ? 'Produção' : 'Recibos';

    return (
        <>
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Impressoras Configuradas</h3>
                        <p className="text-sm text-text-muted">Gerencie as impressoras térmicas conectadas ao PDV e KDS.</p>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span> Nova Impressora
                    </button>
                </div>

                {printers.length === 0 ? (
                    <div className="p-8 text-center text-text-muted">Nenhuma impressora cadastrada.</div>
                ) : (
                    <div className="space-y-3">
                        {printers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border-subtle bg-background-dark">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 bg-surface border border-border-subtle rounded-lg flex items-center justify-center text-text-muted">
                                        <span className="material-symbols-outlined">print</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">{p.name}</h4>
                                        <p className="text-xs text-text-muted">Destino: {targetLabel(p.target)} · Tipo: {typeLabel(p.type)}</p>
                                        {p.ip_address && <p className="text-xs text-text-muted mt-0.5">IP: {p.ip_address}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.is_online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_online ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                        {p.is_online ? 'Online' : 'Offline'}
                                    </span>
                                    <button onClick={() => openEdit(p)} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-text-muted hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Impressora' : 'Nova Impressora'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <Label>Nome da Impressora</Label>
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" required />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo</Label>
                            <select value={data.type} onChange={e => setData('type', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                                <option value="receipt">Recibos</option>
                                <option value="production">Produção</option>
                            </select>
                        </div>
                        <div>
                            <Label>Destino</Label>
                            <select value={data.target} onChange={e => setData('target', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none">
                                <option value="cash_register">Caixa</option>
                                <option value="kitchen">Cozinha</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label>Endereço IP (Opcional)</Label>
                        <input type="text" value={data.ip_address} onChange={e => setData('ip_address', e.target.value)} placeholder="Ex: 192.168.1.100" className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                    </div>
                    <ModalFooter onClose={() => setModalOpen(false)} processing={processing} label={editingId ? 'Salvar' : 'Adicionar'} />
                </form>
            </Modal>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   TAB: INTEGRAÇÕES
   ═══════════════════════════════════════════════════════════════════ */
function TabIntegracoes() {
    const integrations = [
        { name: 'iFood', desc: 'Receba pedidos do iFood diretamente no PDV.', icon: '🍔', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
        { name: 'WhatsApp', desc: 'Envie notificações de status do pedido ao cliente.', icon: '💬', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
        { name: 'Mercado Pago', desc: 'Aceite pagamentos via Pix e cartão de crédito.', icon: '💳', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        { name: 'Google Maps', desc: 'Calcule taxas de entrega por distância automaticamente.', icon: '📍', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    ];

    return (
        <Card>
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Integrações</h3>
                <p className="text-sm text-text-muted">Conecte serviços externos ao seu sistema.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {integrations.map(i => (
                    <div key={i.name} className="relative group p-5 rounded-xl border border-border-subtle bg-background-dark hover:border-border-subtle-hover transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{i.icon}</span>
                            <h4 className="text-white font-bold text-sm">{i.name}</h4>
                        </div>
                        <p className="text-xs text-text-muted mb-4">{i.desc}</p>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-surface text-text-muted border border-border-subtle">
                            <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                            Em breve
                        </span>
                        <div className="absolute inset-0 rounded-xl bg-background-dark/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-bold text-text-muted">Em breve</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ── Shared tiny components ── */
function Card({ children }) {
    return <div className="bg-surface rounded-2xl border border-border-subtle p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>{children}</div>;
}

function Label({ children }) {
    return <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">{children}</label>;
}

function ModalFooter({ onClose, processing, label }) {
    return (
        <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={processing} className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50">{processing ? 'Salvando...' : label}</button>
        </div>
    );
}
