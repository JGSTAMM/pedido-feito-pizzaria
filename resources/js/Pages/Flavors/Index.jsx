import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import AppLayout from '@/Layouts/AppLayout';

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

export default function Index({ flavors = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        base_price: '',
        is_active: true,
    });

    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    const filtered = flavors.filter(f =>
        norm(f.name).includes(norm(searchTerm))
    );

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (flavor) => {
        clearErrors();
        setData({
            name: flavor.name,
            base_price: flavor.base_price,
            is_active: Boolean(flavor.is_active ?? true),
        });
        setEditingId(flavor.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este sabor?')) {
            router.delete(`/flavors/${id}`);
        }
    };

    const toggleStatus = (id) => {
        router.patch(`/flavors/${id}/toggle-status`, {}, {
            preserveScroll: true
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/flavors/${editingId}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/flavors', {
                onSuccess: () => setIsFormOpen(false),
            });
        }
    };

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">restaurant_menu</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Sabores de Pizza</h2>
                            <p className="text-text-muted text-xs">Gerencie os sabores disponíveis no cardápio</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Sabor
                    </button>
                </header>

                <div className="p-10">
                    {/* Search */}
                    <div className="mb-6 relative w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input
                            type="text"
                            placeholder="Buscar sabor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-6 py-4 border-b border-border-subtle bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                            <span>Nome do Sabor</span>
                            <span>Preço Base</span>
                            <span>Status</span>
                            <span className="text-right">Ações</span>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">Nenhum sabor encontrado.</div>
                        ) : (
                            filtered.map((flavor, idx) => (
                                <div key={flavor.id} className={`grid grid-cols-[1fr_120px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors ${idx !== filtered.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                    <div className="font-semibold text-white truncate text-base">{flavor.name}</div>
                                    <div className="font-mono font-bold text-emerald-400">{formatBRL(flavor.base_price)}</div>
                                    <div>
                                        <button
                                            onClick={() => toggleStatus(flavor.id)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark ${flavor.is_active !== false ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-surface-hover'}`}
                                        >
                                            <span className="sr-only">Toggle Status</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${flavor.is_active !== false ? 'translate-x-2.5' : '-translate-x-2.5'}`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex justify-end gap-2 px-2">
                                        <button onClick={() => openEdit(flavor)} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        <button onClick={() => handleDelete(flavor.id)} className="text-text-muted hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Sabor' : 'Novo Sabor'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nome do Sabor</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ex: Calabresa"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Preço Base (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.base_price}
                            onChange={e => setData('base_price', e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.base_price && <div className="text-red-400 text-xs mt-1">{errors.base_price}</div>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                            />
                            <span className="text-sm text-white font-medium">Sabor Ativo no Cardápio</span>
                        </label>
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
                            {processing ? 'Salvando...' : 'Salvar Sabor'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
