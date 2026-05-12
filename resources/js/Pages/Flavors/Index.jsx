import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import AppLayout from '@/Layouts/AppLayout';
import useI18n from '@/hooks/useI18n';

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
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        base_price: '',
        is_active_delivery: true,
        is_active_pos: true,
        ingredients_json: [],
        image: null,
        clear_image: false,
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
            is_active_delivery: Boolean(flavor.is_active_delivery ?? true),
            is_active_pos: Boolean(flavor.is_active_pos ?? true),
            ingredients_json: Array.isArray(flavor.ingredients_json) ? flavor.ingredients_json : [],
            image: null,
            clear_image: false,
        });
        setEditingId(flavor.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm(t('flavors.messages.confirmDelete'))) {
            router.delete(`/flavors/${id}`);
        }
    };

    const toggleStatus = (id) => {
        router.patch(`/flavors/${id}/toggle-status`, {}, {
            preserveScroll: true
        });
    };

    const addIngredient = (name) => {
        if (!name.trim()) return;
        const newIngredients = [...(data.ingredients_json || []), { name, is_available: true }];
        setData('ingredients_json', newIngredients);
    };

    const removeIngredient = (index) => {
        const newIngredients = data.ingredients_json.filter((_, i) => i !== index);
        setData('ingredients_json', newIngredients);
    };

    const toggleIngredientAvailability = (index) => {
        const newIngredients = data.ingredients_json.map((ing, i) =>
            i === index ? { ...ing, is_available: !ing.is_available } : ing
        );
        setData('ingredients_json', newIngredients);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            // Inertia doesn't support multipart files on PUT requests directly.
            // We use router.post with a _method: 'PUT' field to spoof the request.
            router.post(`/flavors/${editingId}`, {
                _method: 'PUT',
                name: data.name,
                base_price: data.base_price,
                is_active_delivery: data.is_active_delivery,
                is_active_pos: data.is_active_pos,
                ingredients_json: data.ingredients_json,
                image: data.image,
                clear_image: data.clear_image,
            }, {
                forceFormData: true,
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/flavors', {
                forceFormData: true,
                onSuccess: () => setIsFormOpen(false),
            });
        }
    };

    const currentFlavor = flavors.find(f => f.id === editingId);

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto pb-20">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">restaurant_menu</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">{t('flavors.header.title')}</h2>
                            <p className="text-text-muted text-xs">{t('flavors.header.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                        {t('flavors.actions.new')}
                    </button>
                </header>

                <div className="p-10">
                    {/* Search */}
                    <div className="mb-6 relative w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input
                            type="text"
                            placeholder={t('flavors.search.placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                        <div className="grid grid-cols-[60px_1fr_120px_100px_80px] gap-4 px-6 py-4 border-b border-border-subtle bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                            <span>Imagem</span>
                            <span>{t('flavors.table.name')}</span>
                            <span>{t('flavors.table.basePrice')}</span>
                            <span>{t('flavors.table.status')}</span>
                            <span className="text-right">{t('flavors.table.actions')}</span>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">{t('flavors.empty')}</div>
                        ) : (
                            filtered.map((flavor, idx) => (
                                <div key={flavor.id} className={`grid grid-cols-[60px_1fr_120px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors ${idx !== filtered.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center overflow-hidden border border-border-subtle">
                                        {flavor.image_url ? (
                                            <img src={flavor.image_url} alt={flavor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-text-muted text-xl">image</span>
                                        )}
                                    </div>
                                    <div className="font-semibold text-white truncate text-base">{flavor.name}</div>
                                    <div className="font-mono font-bold text-emerald-400">{formatBRL(flavor.base_price)}</div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleStatus(flavor.id)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark ${flavor.is_active_delivery || flavor.is_active_pos ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-surface-hover'}`}
                                        >
                                            <span className="sr-only">{t('flavors.table.toggleStatus')}</span>
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${flavor.is_active_delivery || flavor.is_active_pos ? 'translate-x-2.5' : '-translate-x-2.5'}`}
                                            />
                                        </button>
                                        <div className="flex gap-1">
                                            {flavor.is_active_delivery && <span className="material-symbols-outlined text-[14px] text-sky-400" title="Delivery">delivery_dining</span>}
                                            {flavor.is_active_pos && <span className="material-symbols-outlined text-[14px] text-amber-400" title="Salão / Mesa">restaurant</span>}
                                        </div>
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
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? t('flavors.modal.editTitle') : t('flavors.modal.newTitle')}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('flavors.form.name')}</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder={t('flavors.form.namePlaceholder')}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.name && <div className="text-red-400 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">{t('flavors.form.basePrice')}</label>
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

                    {/* Image Upload Box (Dark Glassmorphism) */}
                    <div className="bg-[#111115]/50 backdrop-blur-md border border-border-subtle p-4 rounded-2xl flex flex-col gap-3">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Imagem do Sabor</label>
                        
                        <div className="flex items-center gap-4">
                            {/* Preview/Thumbnail */}
                            <div className="size-16 rounded-xl bg-surface border border-border-subtle overflow-hidden flex items-center justify-center shrink-0">
                                {data.image ? (
                                    <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (currentFlavor?.image_url && !data.clear_image) ? (
                                    <img src={currentFlavor.image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-text-muted text-2xl">image</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-surface hover:bg-surface-hover border border-border-subtle text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-base">upload</span>
                                        <span>Selecionar</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setData(prev => ({ ...prev, image: file, clear_image: false }));
                                                }
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                    {((currentFlavor?.image_url && !data.clear_image) || data.image) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData(prev => ({ ...prev, image: null, clear_image: true }));
                                            }}
                                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                            <span>Remover</span>
                                        </button>
                                    )}
                                </div>
                                <p className="text-text-muted text-[10px] leading-relaxed">
                                    Adicione imagem para o produto/sabor. Formato sugerido: WebP ou JPG quadrado para melhor performance e qualidade.
                                </p>
                            </div>
                        </div>
                        {errors.image && <div className="text-red-400 text-xs mt-1">{errors.image}</div>}
                    </div>

                    {/* Ingredients Section */}
                    <div className="mt-2">
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">{t('flavors.form.ingredientsLabel')}</label>
                        
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                id="new-ingredient"
                                placeholder={t('flavors.form.ingredientPlaceholder')}
                                className="flex-1 bg-surface border border-border-subtle rounded-xl px-4 py-2 text-sm text-white focus:border-primary/50 outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addIngredient(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.getElementById('new-ingredient');
                                    addIngredient(input.value);
                                    input.value = '';
                                }}
                                className="bg-surface-hover hover:bg-primary/20 text-primary p-2 rounded-xl border border-border-subtle transition-colors"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {data.ingredients_json.map((ing, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-surface-hover/50 p-2 rounded-lg border border-border-subtle">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleIngredientAvailability(idx)}
                                            className={`size-2 rounded-full ${ing.is_available ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                                            title={ing.is_available ? 'Disponível' : 'Indisponível'}
                                        />
                                        <span className={`text-sm ${ing.is_available ? 'text-white' : 'text-text-muted line-through'}`}>{ing.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(idx)}
                                        className="text-text-muted hover:text-red-400 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Channel Visibility */}
                    <div className="bg-black/20 p-4 rounded-2xl border border-border-subtle flex flex-col gap-3">
                        <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 italic">Visibilidade por Canal</label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_active_delivery}
                                    onChange={e => setData('is_active_delivery', e.target.checked)}
                                    className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                                />
                                <span className="text-sm text-white group-hover:text-primary transition-colors">Delivery</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_active_pos}
                                    onChange={e => setData('is_active_pos', e.target.checked)}
                                    className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                                />
                                <span className="text-sm text-white group-hover:text-primary transition-colors">Salão / Mesa</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border-subtle">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-colors"
                        >
                            {t('flavors.form.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {processing ? t('flavors.form.saving') : t('flavors.form.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
