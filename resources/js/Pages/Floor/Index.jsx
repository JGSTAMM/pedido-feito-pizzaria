import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import AppLayout from '@/Layouts/AppLayout';
import TableOrderDrawer from './TableOrderDrawer';

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#18181F] w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-border-subtle">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function Index({
    tables = [],
    stats = {},
    products = [],
    pizzaFlavors = [],
    pizzaSizes = [],
    categories = [],
    borderOptions = [],
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // ── Drawer state ──
    const [selectedTable, setSelectedTable] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        capacity: '',
    });

    // ── Synchronize selected table with Inertia updates ──
    useEffect(() => {
        if (selectedTable) {
            const updated = tables.find(t => t.id === selectedTable.id);
            if (updated) {
                setSelectedTable(updated);
            } else {
                setIsDrawerOpen(false);
            }
        }
    }, [tables]);

    const filtered = tables.filter(t =>
        norm(t.name).includes(norm(searchTerm))
    );

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (table) => {
        clearErrors();
        setData({
            name: table.name,
            capacity: table.seats,
        });
        setEditingId(table.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja remover esta mesa?')) {
            router.delete(`/floor/${id}`);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/floor/${editingId}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/floor', {
                onSuccess: () => setIsFormOpen(false),
            });
        }
    };

    // ── Table Click Handler ──
    const handleTableClick = (table) => {
        if (isEditMode) return; // In edit mode, clicks do nothing (edit/delete are separate buttons)
        setSelectedTable(table);
        setIsDrawerOpen(true);
    };

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">table_restaurant</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Mapa do Salão</h2>
                            <p className="text-text-muted text-xs">Visão geral e status das mesas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all border ${isEditMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-surface hover:bg-surface-hover text-text-muted border-border-subtle'}`}
                        >
                            <span className="material-symbols-outlined text-lg">edit_square</span>
                            {isEditMode ? 'Modo de Edição Ativo' : 'Editar Layout'}
                        </button>
                        {isEditMode && (
                            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-lg">add</span>
                                Nova Mesa
                            </button>
                        )}
                    </div>
                </header>

                <div className="p-10 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-surface border border-border-subtle rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                            <span className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Total de Mesas</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{stats.total || 0}</span>
                            </div>
                        </div>
                        <div className="bg-surface border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                            <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Livres
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{stats.free || 0}</span>
                            </div>
                        </div>
                        <div className="bg-surface border border-orange-500/20 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                            <span className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                Ocupadas
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{stats.occupied || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="relative w-96">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                            <input
                                type="text"
                                placeholder="Buscar mesa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Floor Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.length === 0 ? (
                            <div className="col-span-full p-12 text-center text-text-muted bg-surface rounded-2xl border border-border-subtle">
                                Nenhuma mesa encontrada.
                            </div>
                        ) : (
                            filtered.map(table => (
                                <div
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`bg-surface border rounded-2xl p-6 relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${!isEditMode ? 'cursor-pointer' : ''} ${table.status === 'occupied' ? 'border-orange-500/30 shadow-orange-500/5' : 'border-emerald-500/30 shadow-emerald-500/5'}`}
                                >
                                    {/* Edit / Delete overlay actions */}
                                    {isEditMode && (
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(table); }} className="bg-black/50 p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-black/80 transition-all backdrop-blur-md">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }} className="bg-black/50 p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-black/80 transition-all backdrop-blur-md">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-6 pt-2">
                                        <div>
                                            <h3 className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors">{table.name}</h3>
                                            <span className="text-text-muted text-sm">{table.seats} Lugares</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${table.status === 'occupied' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${table.status === 'occupied' ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                                            {table.status === 'occupied' ? 'Ocupada' : 'Livre'}
                                        </div>
                                    </div>

                                    {table.status === 'occupied' && table.active_order ? (
                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative overflow-hidden group/order">
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover/order:opacity-100 transition-opacity"></div>
                                            <div className="flex justify-between items-end relative z-10">
                                                <div>
                                                    <span className="text-text-muted text-xs block mb-1">Pedido Atual</span>
                                                    <span className="text-sm font-bold text-white">#{table.active_order.short_code || String(table.active_order.id).substring(0, 5).toUpperCase()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-orange-400 text-xs font-bold block mb-1">
                                                        {Math.floor(table.active_order.elapsed_minutes)} {Math.floor(table.active_order.elapsed_minutes) === 1 ? 'min atrás' : 'mins atrás'}
                                                    </span>
                                                    <span className="text-lg font-black text-emerald-400 tracking-tight flex items-center justify-end gap-1">
                                                        <span className="text-xs text-text-muted font-normal">R$</span>
                                                        {Number(table.active_order.total).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[76px] flex items-center justify-center rounded-xl border border-dashed border-border-subtle bg-black/20 text-text-muted text-sm">
                                            {isEditMode ? (
                                                <span>Mesa disponível</span>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                                    Clique para Abrir Mesa
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Table Order Drawer */}
            <TableOrderDrawer
                table={selectedTable}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                products={products}
                pizzaFlavors={pizzaFlavors}
                pizzaSizes={pizzaSizes}
                categories={categories}
                borderOptions={borderOptions}
            />

            {/* Form Modal (Edit Mode) */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Mesa' : 'Nova Mesa'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nome/Número da Mesa</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ex: Mesa 12"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Capacidade (Lugares)</label>
                        <input
                            type="number"
                            min="1"
                            value={data.capacity}
                            onChange={e => setData('capacity', e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.capacity && <div className="text-red-400 text-xs mt-1">{errors.capacity}</div>}
                    </div>

                    <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-subtle">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Salvando...' : 'Salvar Mesa'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
