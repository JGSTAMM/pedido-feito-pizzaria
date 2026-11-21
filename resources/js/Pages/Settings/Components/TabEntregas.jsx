import { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import { Card, Label, Modal, ModalFooter } from './Shared';
import AdminPinUnlockModal from './AdminPinUnlockModal';

const formatBrl = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TabEntregas({ neighborhoods = [], deliveryFeeSecurity = {} }) {
    const canEditDirectly = Boolean(deliveryFeeSecurity?.can_edit_directly);
    const [isUnlocked, setIsUnlocked] = useState(
        Boolean(deliveryFeeSecurity?.can_edit_directly || deliveryFeeSecurity?.is_unlocked)
    );
    const [unlockedByName, setUnlockedByName] = useState(deliveryFeeSecurity?.unlocked_by_name || null);
    const [pinModalOpen, setPinModalOpen] = useState(false);

    const [selectedCity, setSelectedCity] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [draftFees, setDraftFees] = useState({});
    const [savingBulk, setSavingBulk] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({
        city: 'Torres',
        name: '',
        delivery_fee: '',
        observation: '',
    });

    useEffect(() => {
        setIsUnlocked(Boolean(deliveryFeeSecurity?.can_edit_directly || deliveryFeeSecurity?.is_unlocked));
        setUnlockedByName(deliveryFeeSecurity?.unlocked_by_name || null);
    }, [deliveryFeeSecurity]);

    const cities = useMemo(() => {
        const set = new Set(neighborhoods.map((n) => n.city).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [neighborhoods]);

    const filteredNeighborhoods = useMemo(() => {
        const q = norm(searchQuery.trim());
        return neighborhoods.filter((n) => {
            if (selectedCity !== 'all' && n.city !== selectedCity) return false;
            if (!q) return true;
            return (
                norm(n.name).includes(q)
                || norm(n.city).includes(q)
                || norm(n.observation || '').includes(q)
            );
        });
    }, [neighborhoods, selectedCity, searchQuery]);

    const changedItems = useMemo(() => {
        return neighborhoods
            .filter((n) => {
                if (!Object.prototype.hasOwnProperty.call(draftFees, n.id)) return false;
                const parsed = parseFloat(String(draftFees[n.id]).replace(',', '.'));
                if (Number.isNaN(parsed) || parsed < 0) return false;
                return Math.abs(parsed - Number(n.delivery_fee)) > 0.001;
            })
            .map((n) => ({
                id: n.id,
                delivery_fee: Number(parseFloat(String(draftFees[n.id]).replace(',', '.')).toFixed(2)),
            }));
    }, [neighborhoods, draftFees]);

    const stats = useMemo(() => {
        if (neighborhoods.length === 0) return { min: 0, max: 0 };
        const fees = neighborhoods.map((n) => Number(n.delivery_fee || 0));
        return {
            min: Math.min(...fees),
            max: Math.max(...fees),
        };
    }, [neighborhoods]);

    const requireUnlockOrRun = (action) => {
        if (isUnlocked) {
            action();
            return;
        }
        setPinModalOpen(true);
    };

    const handleInlineChange = (neighborhood, rawValue) => {
        if (!isUnlocked) {
            setPinModalOpen(true);
            return;
        }
        setDraftFees((prev) => ({
            ...prev,
            [neighborhood.id]: rawValue,
        }));
    };

    const handleBulkSave = () => {
        if (!isUnlocked) {
            setPinModalOpen(true);
            return;
        }
        if (changedItems.length === 0 || savingBulk) return;

        setSavingBulk(true);
        router.post(
            '/neighborhoods/bulk-update',
            { items: changedItems },
            {
                preserveScroll: true,
                onSuccess: () => setDraftFees({}),
                onFinish: () => setSavingBulk(false),
            }
        );
    };

    const openCreateModal = () => {
        requireUnlockOrRun(() => {
            clearErrors();
            reset();
            setData({
                city: selectedCity !== 'all' ? selectedCity : (cities[0] || 'Torres'),
                name: '',
                delivery_fee: '',
                observation: '',
            });
            setEditingItem(null);
            setModalOpen(true);
        });
    };

    const openEditModal = (neighborhood) => {
        requireUnlockOrRun(() => {
            clearErrors();
            setData({
                city: neighborhood.city || 'Torres',
                name: neighborhood.name || '',
                delivery_fee: String(Number(neighborhood.delivery_fee ?? 0)),
                observation: neighborhood.observation || '',
            });
            setEditingItem(neighborhood);
            setModalOpen(true);
        });
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setEditingItem(null);
            },
        };

        if (editingItem) {
            put(`/neighborhoods/${editingItem.id}`, options);
        } else {
            post('/neighborhoods', options);
        }
    };

    const handleDelete = (neighborhood) => {
        requireUnlockOrRun(() => {
            if (!window.confirm(`Remover "${neighborhood.name} (${neighborhood.city})" da tabela de tele-entrega?`)) {
                return;
            }
            router.delete(`/neighborhoods/${neighborhood.id}`, {
                preserveScroll: true,
            });
        });
    };

    const handleLockSession = () => {
        router.post('/neighborhoods/lock-admin-pin', {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUnlocked(false);
                setUnlockedByName(null);
                setDraftFees({});
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Authorization Banner for non-admin users */}
            {!canEditDirectly && (
                <div
                    className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isUnlocked
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
                            : 'bg-orange-500/10 border-orange-500/25 text-orange-200'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[22px] mt-0.5">
                            {isUnlocked ? 'lock_open' : 'lock'}
                        </span>
                        <div>
                            <p className="text-sm font-bold">
                                {isUnlocked
                                    ? `Edição liberada por PIN do Administrador${unlockedByName ? ` (${unlockedByName})` : ''}`
                                    : 'Modo Somente Leitura — Alteração restrita ao Administrador'}
                            </p>
                            <p className="text-xs opacity-80 mt-0.5">
                                {isUnlocked
                                    ? 'Você pode ajustar os valores das tele-entregas, adicionar ou remover bairros.'
                                    : 'Para alterar os valores das tele-entregas nesta conta, solicite o PIN de 4 dígitos do Administrador.'}
                            </p>
                        </div>
                    </div>

                    {isUnlocked ? (
                        <button
                            type="button"
                            onClick={handleLockSession}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                        >
                            Bloquear novamente
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPinModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl text-xs font-black bg-orange-500 hover:bg-orange-400 text-black transition-all shrink-0 flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[16px]">key</span>
                            Desbloquear com PIN do Admin
                        </button>
                    )}
                </div>
            )}

            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Taxas de Tele-Entrega por Bairro</h3>
                        <p className="text-sm text-text-muted mt-0.5">
                            Altere os valores das entregas diretamente na tabela ou cadastre novos bairros.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-dark text-white transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                        Novo Bairro
                    </button>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl border border-border-subtle bg-background-dark/50 p-3.5">
                        <p className="text-[11px] font-bold text-text-muted uppercase">Bairros Ativos</p>
                        <p className="text-xl font-black text-white mt-1">{neighborhoods.length}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-background-dark/50 p-3.5">
                        <p className="text-[11px] font-bold text-text-muted uppercase">Cidades</p>
                        <p className="text-xl font-black text-white mt-1">{cities.length}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-background-dark/50 p-3.5">
                        <p className="text-[11px] font-bold text-text-muted uppercase">Menor Taxa</p>
                        <p className="text-xl font-black text-emerald-400 mt-1">{formatBrl(stats.min)}</p>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-background-dark/50 p-3.5">
                        <p className="text-[11px] font-bold text-text-muted uppercase">Maior Taxa</p>
                        <p className="text-xl font-black text-amber-400 mt-1">{formatBrl(stats.max)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCity('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                                selectedCity === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-text-muted hover:text-white'
                            }`}
                        >
                            Todas ({neighborhoods.length})
                        </button>
                        {cities.map((city) => {
                            const count = neighborhoods.filter((n) => n.city === city).length;
                            return (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => setSelectedCity(city)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                                        selectedCity === city
                                            ? 'bg-primary text-white'
                                            : 'bg-white/5 text-text-muted hover:text-white'
                                    }`}
                                >
                                    {city} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full md:w-72">
                        <span className="material-symbols-outlined text-[18px] text-text-muted absolute left-3 top-1/2 -translate-y-1/2">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar bairro ou observação..."
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
                        />
                    </div>
                </div>

                {/* Batch save bar */}
                {changedItems.length > 0 && (
                    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-sm font-bold text-white">
                            {changedItems.length} alteração(ões) pendente(s) para salvar
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setDraftFees({})}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-white bg-white/5"
                            >
                                Descartar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkSave}
                                disabled={savingBulk}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50"
                            >
                                {savingBulk ? 'Salvando...' : `Salvar ${changedItems.length} alteração(ões)`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border-subtle">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background-dark/60 border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-text-muted">
                                <th className="py-3 px-4">Cidade</th>
                                <th className="py-3 px-4">Bairro</th>
                                <th className="py-3 px-4">Observação</th>
                                <th className="py-3 px-4 w-40">Valor da Tele (R$)</th>
                                <th className="py-3 px-4 text-right w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/60 text-sm">
                            {filteredNeighborhoods.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-text-muted">
                                        Nenhum bairro encontrado para este filtro.
                                    </td>
                                </tr>
                            ) : (
                                filteredNeighborhoods.map((item) => {
                                    const hasDraft = Object.prototype.hasOwnProperty.call(draftFees, item.id);
                                    const currentValue = hasDraft ? draftFees[item.id] : String(Number(item.delivery_fee ?? 0));
                                    const parsedDraft = parseFloat(String(currentValue).replace(',', '.'));
                                    const isModified = hasDraft && !Number.isNaN(parsedDraft) && Math.abs(parsedDraft - Number(item.delivery_fee)) > 0.001;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition-colors ${
                                                isModified ? 'bg-primary/10' : 'hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            <td className="py-3 px-4 text-xs font-bold text-text-muted whitespace-nowrap">
                                                {item.city}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-text-muted">
                                                {item.observation ? (
                                                    <span className="inline-flex px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/75">
                                                        {item.observation}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4">
                                                <div className="relative flex items-center">
                                                    <span className="text-xs font-bold text-text-muted mr-1.5">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.50"
                                                        min="0"
                                                        max="9999.99"
                                                        readOnly={!isUnlocked}
                                                        value={currentValue}
                                                        onClick={() => { if (!isUnlocked) setPinModalOpen(true); }}
                                                        onChange={(e) => handleInlineChange(item, e.target.value)}
                                                        aria-label={`Taxa de entrega ${item.name}`}
                                                        className={`w-28 bg-surface border rounded-lg px-2.5 py-1.5 text-sm font-bold text-white outline-none transition-colors ${
                                                            isModified
                                                                ? 'border-primary'
                                                                : 'border-border-subtle focus:border-primary/50'
                                                        } ${!isUnlocked ? 'cursor-pointer opacity-75' : ''}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        title="Editar detalhes"
                                                        className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        title="Remover bairro"
                                                        className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingItem ? `Editar Bairro: ${editingItem.name}` : 'Adicionar Bairro e Taxa'}
            >
                <form onSubmit={handleModalSubmit} className="space-y-4">
                    <div>
                        <Label>Cidade</Label>
                        <input
                            type="text"
                            required
                            list="cities-datalist"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            placeholder="Ex: Torres ou Passo de Torres"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                        <datalist id="cities-datalist">
                            {cities.map((c) => <option key={c} value={c} />)}
                        </datalist>
                        {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
                    </div>

                    <div>
                        <Label>Nome do Bairro</Label>
                        <input
                            type="text"
                            required
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ex: Centro"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <Label>Valor da Tele-Entrega (R$)</Label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="9999.99"
                            required
                            value={data.delivery_fee}
                            onChange={(e) => setData('delivery_fee', e.target.value)}
                            placeholder="Ex: 15.00"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                        {errors.delivery_fee && <p className="text-xs text-red-400 mt-1">{errors.delivery_fee}</p>}
                    </div>

                    <div>
                        <Label>Observação (Opcional)</Label>
                        <input
                            type="text"
                            value={data.observation}
                            onChange={(e) => setData('observation', e.target.value)}
                            placeholder="Ex: início, até Davi..."
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                        />
                        {errors.observation && <p className="text-xs text-red-400 mt-1">{errors.observation}</p>}
                    </div>

                    <ModalFooter
                        onClose={() => setModalOpen(false)}
                        processing={processing}
                        label={editingItem ? 'Salvar Alterações' : 'Adicionar Bairro'}
                    />
                </form>
            </Modal>

            <AdminPinUnlockModal
                isOpen={pinModalOpen}
                onClose={() => setPinModalOpen(false)}
                onUnlocked={(adminName) => {
                    setIsUnlocked(true);
                    setUnlockedByName(adminName);
                }}
            />
        </div>
    );
}
