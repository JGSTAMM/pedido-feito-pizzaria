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

export default function Index({ sizes = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        slices: '',
        max_flavors: '',
        is_special_broto_rule: false,
        is_active: true,
    });

    const filtered = sizes.filter(s =>
        norm(s.name).includes(norm(searchTerm))
    );

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (size) => {
        clearErrors();
        setData({
            name: size.name,
            slices: size.slices,
            max_flavors: size.max_flavors,
            is_special_broto_rule: Boolean(size.is_special_broto_rule),
            is_active: Boolean(size.is_active ?? true),
        });
        setEditingId(size.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este tamanho?')) {
            router.delete(`/sizes/${id}`);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/sizes/${editingId}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/sizes', {
                onSuccess: () => setIsFormOpen(false),
            });
        }
    };

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">straighten</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Tamanhos de Pizza</h2>
                            <p className="text-text-muted text-xs">Defina fatias e limites de sabores por tamanho</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Tamanho
                    </button>
                </header>

                <div className="p-10">
                    {/* Search */}
                    <div className="mb-6 relative w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input
                            type="text"
                            placeholder="Buscar tamanho..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="grid grid-cols-[1fr_100px_100px_150px_100px_80px] gap-4 px-6 py-4 border-b border-border-subtle bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                            <span>Tamanho</span>
                            <span>Fatias</span>
                            <span>Máx. Sabores</span>
                            <span>Regra Preço Broto</span>
                            <span>Status</span>
                            <span className="text-right">Ações</span>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">Nenhum tamanho encontrado.</div>
                        ) : (
                            filtered.map((size, idx) => (
                                <div key={size.id} className={`grid grid-cols-[1fr_100px_100px_150px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors ${idx !== filtered.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                    <div className="font-semibold text-white truncate text-base">{size.name}</div>
                                    <div className="text-text-muted">{size.slices} fatias</div>
                                    <div className="text-text-muted font-mono">{size.max_flavors}</div>
                                    <div>
                                        {size.is_special_broto_rule ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase">Ativa</span>
                                        ) : (
                                            <span className="text-text-muted text-xs">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${size.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {size.is_active !== false ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end gap-2 px-2">
                                        <button onClick={() => openEdit(size)} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        <button onClick={() => handleDelete(size.id)} className="text-text-muted hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Tamanho' : 'Novo Tamanho'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nome do Tamanho</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ex: Grande"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Fatias</label>
                            <input
                                type="number"
                                min="1"
                                value={data.slices}
                                onChange={e => setData('slices', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.slices && <div className="text-red-400 text-xs mt-1">{errors.slices}</div>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Máx. Sabores</label>
                            <input
                                type="number"
                                min="1"
                                value={data.max_flavors}
                                onChange={e => setData('max_flavors', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.max_flavors && <div className="text-red-400 text-xs mt-1">{errors.max_flavors}</div>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_special_broto_rule}
                                onChange={e => setData('is_special_broto_rule', e.target.checked)}
                                className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                            />
                            <span className="text-sm text-white font-medium">Aplicar Regra Especial Preço (Broto)</span>
                        </label>
                        <p className="text-xs text-text-muted pl-6 italic">Aplica fórmula <code>(Sabor / 2) + R$ 5,00</code> se 1 sabor for escolhido.</p>

                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                            />
                            <span className="text-sm text-white font-medium">Tamanho Ativo no Cardápio</span>
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
                            {processing ? 'Salvando...' : 'Salvar Tamanho'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
