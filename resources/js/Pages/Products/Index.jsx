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

export default function Index({ products = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        category: '',
        price: '',
        description: '',
        is_active: true,
    });

    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    const filtered = products.filter(p =>
        norm(p.name).includes(norm(searchTerm)) ||
        norm(p.category).includes(norm(searchTerm))
    );

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (product) => {
        clearErrors();
        setData({
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description || '',
            is_active: Boolean(product.is_active ?? true),
        });
        setEditingId(product.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            router.delete(`/products/${id}`);
        }
    };

    const toggleStatus = (id) => {
        router.patch(`/products/${id}/toggle-status`, {}, {
            preserveScroll: true
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/products/${editingId}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/products', {
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
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Produtos</h2>
                            <p className="text-text-muted text-xs">Catálogo geral de bebidas e complementos</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Produto
                    </button>
                </header>

                <div className="p-10">
                    {/* Search Bar */}
                    <div className="mb-6 relative w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="grid grid-cols-[60px_1fr_150px_120px_100px_80px] gap-4 px-6 py-4 border-b border-border-subtle bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                            <span>Img</span>
                            <span>Nome do Produto</span>
                            <span>Categoria</span>
                            <span>Preço</span>
                            <span>Status</span>
                            <span className="text-right">Ações</span>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">Nenhum produto encontrado.</div>
                        ) : (
                            filtered.map((product, idx) => (
                                <div key={product.id} className={`grid grid-cols-[60px_1fr_150px_120px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors ${idx !== filtered.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center overflow-hidden border border-border-subtle">
                                        {product.image_url ? (
                                            <img src={product.image_url.startsWith('http') ? product.image_url : `/storage/${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-text-muted text-xl">image</span>
                                        )}
                                    </div>
                                    <div className="font-semibold text-white truncate">{product.name}</div>
                                    <div className="text-sm text-text-muted truncate capitalize">{product.category}</div>
                                    <div className="font-mono font-bold text-emerald-400">{formatBRL(product.price)}</div>
                                    <div>
                                        <button
                                            onClick={() => toggleStatus(product.id)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark ${product.is_active !== false ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-surface-hover'}`}
                                        >
                                            <span className="sr-only">Toggle Status</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.is_active !== false ? 'translate-x-2.5' : '-translate-x-2.5'}`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(product)} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        <button onClick={() => handleDelete(product.id)} className="text-text-muted hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Produto' : 'Novo Produto'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Nome do Produto</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Categoria</label>
                            <input
                                type="text"
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                placeholder="Ex: Bebidas"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.category && <div className="text-red-400 text-xs mt-1">{errors.category}</div>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Preço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.price}
                                onChange={e => setData('price', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.price && <div className="text-red-400 text-xs mt-1">{errors.price}</div>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Descrição</label>
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none resize-none h-20"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={e => setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                            />
                            <span className="text-sm text-white font-medium">Produto Ativo</span>
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
                            {processing ? 'Salvando...' : 'Salvar Produto'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
