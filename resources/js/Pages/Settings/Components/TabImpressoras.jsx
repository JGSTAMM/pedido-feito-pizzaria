import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Card, Modal, Label, ModalFooter } from './Shared';

export default function TabImpressoras({ printers }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { data, setData, post, put, processing, reset, clearErrors, errors } = useForm({ 
        name: '', 
        type: 'receipt', 
        target: 'cash_register', 
        ip_address: '' 
    });

    const openCreate = () => { clearErrors(); reset(); setEditingId(null); setModalOpen(true); };
    const openEdit = (p) => { 
        clearErrors(); 
        setData({ 
            name: p.name, 
            type: p.type, 
            target: p.target, 
            ip_address: p.ip_address || '' 
        }); 
        setEditingId(p.id); 
        setModalOpen(true); 
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/settings/printers/${editingId}`, { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        } else {
            post('/settings/printers', { preserveScroll: true, onSuccess: () => setModalOpen(false) });
        }
    };

    const handleDelete = (id) => { 
        if (confirm('Excluir esta impressora?')) {
            router.delete(`/settings/printers/${id}`, { preserveScroll: true }); 
        }
    };

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
