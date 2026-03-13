import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

export default function Index({ users }) {
    const { flash, errors: pageErrors } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showSuccess, setShowSuccess] = useState(flash?.success || null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'caixa',
    });

    const openModal = (user = null) => {
        clearErrors();
        if (user) {
            setEditingUser(user);
            setData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setEditingUser(null);
            setData({
                name: '',
                email: '',
                password: '',
                role: 'caixa',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(`/users/${editingUser.id}`, {
                onSuccess: () => {
                    closeModal();
                    setShowSuccess('Usuário atualizado com sucesso!');
                    setTimeout(() => setShowSuccess(null), 3000);
                },
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    closeModal();
                    setShowSuccess('Usuário criado com sucesso!');
                    setTimeout(() => setShowSuccess(null), 3000);
                },
            });
        }
    };

    const handleDelete = (user) => {
        if (confirm(`Tem certeza que deseja excluir o funcionário ${user.name}?`)) {
            destroy(`/users/${user.id}`, {
                onSuccess: () => {
                    setShowSuccess('Funcionário excluído!');
                    setTimeout(() => setShowSuccess(null), 3000);
                }
            });
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <span className="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider rounded-full border border-violet-500/30">Admin</span>;
            case 'caixa':
                return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/30">Caixa</span>;
            case 'garcom':
                return <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-full border border-gray-500/30">Garçom</span>;
            default:
                return null;
        }
    };

    return (
        <AppLayout>
            <Head title="Gestão de Equipe" />
            
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl backdrop-blur-lg shadow-2xl animate-pulse">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-semibold text-sm">{showSuccess}</span>
                </div>
            )}
            
            {pageErrors?.error && (
                <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-4 rounded-xl backdrop-blur-lg shadow-2xl animate-pulse">
                    <span className="material-symbols-outlined">error</span>
                    <span className="font-semibold text-sm">{pageErrors.error}</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border-subtle p-8 md:p-10 sticky top-0 z-10 backdrop-blur-lg">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                    <span className="material-symbols-outlined text-primary text-2xl">group</span>
                                </div>
                                <h2 className="text-white text-3xl font-black tracking-tight">Gestão de Equipe</h2>
                            </div>
                            <p className="text-text-muted mt-1 font-medium ml-1">Gerencie acessos, cargos e funcionários do restaurante.</p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="h-[48px] px-6 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                            Novo Funcionário
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="max-w-7xl mx-auto p-8 md:p-10">
                    <div className="bg-surface/50 border border-border-subtle rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-background-dark/50">
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Funcionário</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Email / Login</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Cargo</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/10">
                                                        {user.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-bold text-sm">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-text-muted font-medium text-sm">{user.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(user)}
                                                        className="w-9 h-9 rounded-lg bg-surface hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center transition-all border border-border-subtle hover:border-white/20"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="w-9 h-9 rounded-lg bg-surface hover:bg-red-500/20 text-text-muted hover:text-red-400 flex items-center justify-center transition-all border border-border-subtle hover:border-red-500/30"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-text-muted">
                                                    <span className="material-symbols-outlined text-4xl mb-3 opacity-50">group_off</span>
                                                    <p className="font-bold uppercase tracking-widest text-sm">Nenhum usuário cadastrado.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Drawer Formulário */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-black/20">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-[18px]">{editingUser ? 'edit' : 'person_add'}</span>
                                </div>
                                {editingUser ? 'Editar Funcionário' : 'Novo Funcionário'}
                            </h3>
                            <button onClick={closeModal} className="text-text-muted hover:text-white transition-colors size-8 flex items-center justify-center rounded-lg hover:bg-white/5">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={submit} className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Nome Completo</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">badge</span>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="Ex: João Lucchese"
                                        required
                                    />
                                </div>
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Email / Login</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">mail</span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="joao@pizzaria.com"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Cargo / Função</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">admin_panel_settings</span>
                                    <select
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl pl-11 pr-10 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="caixa">Caixa</option>
                                        <option value="garcom">Garçom</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                                </div>
                                {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">
                                    Senha {editingUser && <span className="text-white/30 lowercase normal-case">(Opcional)</span>}
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">lock</span>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className="w-full bg-background-dark border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder={editingUser ? "Deixe em branco para não alterar" : "Mínimo 4 caracteres"}
                                        required={!editingUser}
                                    />
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">save</span>
                                            Salvar Funcionário
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
