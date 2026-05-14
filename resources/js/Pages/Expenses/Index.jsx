import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import AppLayout from '@/Layouts/AppLayout';
import CustomNumberInput from '@/Components/CustomNumberInput';

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

export default function Index({ expenses = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        description: '',
        category: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        is_paid: false,
    });

    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    const filtered = expenses.filter(e =>
        norm(e.description).includes(norm(searchTerm)) ||
        norm(e.category).includes(norm(searchTerm))
    );

    const openCreate = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setIsFormOpen(true);
    };

    const openEdit = (expense) => {
        clearErrors();
        setData({
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            expense_date: expense.expense_date,
            is_paid: Boolean(expense.is_paid),
        });
        setEditingId(expense.id);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            router.delete(`/expenses/${id}`);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/expenses/${editingId}`, {
                onSuccess: () => setIsFormOpen(false),
            });
        } else {
            post('/expenses', {
                onSuccess: () => setIsFormOpen(false),
            });
        }
    };

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto pb-20">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-500">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Despesas</h2>
                            <p className="text-text-muted text-xs">Gerencie os custos operacionais do seu negócio</p>
                        </div>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nova Despesa
                    </button>
                </header>

                <div className="p-10">
                    {/* Search Bar */}
                    <div className="mb-6 relative w-96">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                        <input
                            type="text"
                            placeholder="Buscar despesas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="grid grid-cols-[120px_1fr_150px_120px_120px_80px] gap-4 px-6 py-4 border-b border-border-subtle bg-black/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                            <span>Data</span>
                            <span>Descrição</span>
                            <span>Categoria</span>
                            <span>Valor</span>
                            <span>Status</span>
                            <span className="text-right">Ações</span>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">Nenhuma despesa encontrada</div>
                        ) : (
                            filtered.map((expense, idx) => {
                                return (
                                    <div key={expense.id} className={`grid grid-cols-[120px_1fr_150px_120px_120px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors ${idx !== filtered.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                        <div className="text-sm text-text-muted">
                                            {new Date(expense.expense_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                        </div>
                                        <div className="font-semibold text-white truncate">{expense.description}</div>
                                        <div className="text-sm text-text-muted truncate capitalize">{expense.category}</div>
                                        <div className="font-mono font-bold text-rose-400">{formatBRL(expense.amount)}</div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${expense.is_paid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                {expense.is_paid ? 'Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(expense)} className="text-text-muted hover:text-white transition-colors"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                            <button onClick={() => handleDelete(expense.id)} className="text-text-muted hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Editar Despesa' : 'Nova Despesa'}>
                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Descrição</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Ex: Conta de Luz"
                            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                            required
                        />
                        {errors.description && <div className="text-red-400 text-xs mt-1">{errors.description}</div>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Categoria</label>
                            <input
                                type="text"
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                placeholder="Ex: Utilidades"
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.category && <div className="text-red-400 text-xs mt-1">{errors.category}</div>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Valor (R$)</label>
                            <CustomNumberInput 
                                value={data.amount}
                                onChange={val => setData('amount', val)}
                                step={0.01}
                                min={0}
                            />
                            {errors.amount && <div className="text-red-400 text-xs mt-1">{errors.amount}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">Data</label>
                            <input
                                type="date"
                                value={data.expense_date}
                                onChange={e => setData('expense_date', e.target.value)}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none"
                                required
                            />
                            {errors.expense_date && <div className="text-red-400 text-xs mt-1">{errors.expense_date}</div>}
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={data.is_paid}
                                    onChange={e => setData('is_paid', e.target.checked)}
                                    className="w-4 h-4 rounded border-border-subtle text-primary bg-surface focus:ring-primary focus:ring-offset-background-dark"
                                />
                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">Está pago?</span>
                            </label>
                            {errors.is_paid && <div className="text-red-400 text-xs mt-1">{errors.is_paid}</div>}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-subtle">
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
                            {processing ? 'Salvando...' : 'Salvar Despesa'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
