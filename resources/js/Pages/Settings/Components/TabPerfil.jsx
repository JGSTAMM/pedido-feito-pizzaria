import React from 'react';
import { useForm, router } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n';
import { Card, Label } from './Shared';

export default function TabPerfil({ settings, days }) {
    const { t } = useI18n();

    // Form: Store Settings
    const storeForm = useForm({
        name: settings.name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        description: settings.description || '',
    });

    // Form: Branding
    const identityForm = useForm({
        logo: null,
        cover: null,
    });

    // Form: Hours
    const hoursForm = useForm({
        hours: settings.opening_hours || days.reduce((acc, d) => ({ 
            ...acc, 
            [d.id]: { open: '18:00', close: '23:00', is_closed: false } 
        }), {})
    });

    const toggleStoreStatus = () => {
        router.post('/settings/toggle-status', {}, { preserveScroll: true });
    };

    const submitProfile = (e) => {
        e.preventDefault();
        storeForm.post('/settings/profile', { preserveScroll: true });
    };

    const submitIdentity = (e) => {
        e.preventDefault();
        identityForm.post('/settings/identity', { preserveScroll: true });
    };

    const submitHours = (e) => {
        e.preventDefault();
        hoursForm.post('/settings/hours', { preserveScroll: true });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
                {/* Store Status Toggle */}
                <Card>
                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-full flex items-center justify-center border-2 ${settings.is_open ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                <span className="material-symbols-outlined">{settings.is_open ? 'store' : 'store_front'}</span>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">{settings.is_open ? 'Loja Aberta' : 'Loja Fechada'}</h4>
                                <p className="text-sm text-text-muted">Controle se os clientes podem fazer pedidos agora.</p>
                            </div>
                        </div>
                        <button onClick={toggleStoreStatus} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${settings.is_open ? 'bg-emerald-500' : 'bg-surface border border-border-subtle'}`}>
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.is_open ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </Card>

                {/* Identidade Visual */}
                <Card>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Identidade Visual</h3>
                        <p className="text-sm text-text-muted">Logotipo e capa que aparecerão no cardápio digital.</p>
                    </div>
                    <form onSubmit={submitIdentity} className="space-y-8">
                        <div className="flex items-center gap-8">
                            <div className="relative group">
                                <Label>Logotipo</Label>
                                <div className="size-24 rounded-2xl bg-background-dark border-2 border-dashed border-border-subtle flex items-center justify-center overflow-hidden relative group-hover:border-primary/50 transition-colors">
                                    {settings.logo_url ? <img src={settings.logo_url} className="size-full object-contain" /> : <span className="material-symbols-outlined text-text-muted text-3xl">add_photo_alternate</span>}
                                    <input type="file" onChange={e => identityForm.setData('logo', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <Label>Capa do Cardápio</Label>
                                <div className="h-24 w-full rounded-2xl bg-background-dark border-2 border-dashed border-border-subtle flex items-center justify-center overflow-hidden relative group-hover:border-primary/50 transition-colors">
                                    {settings.cover_url ? <img src={settings.cover_url} className="size-full object-cover" /> : <span className="material-symbols-outlined text-text-muted text-3xl">add_photo_alternate</span>}
                                    <input type="file" onChange={e => identityForm.setData('cover', e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-border-subtle">
                            <button type="submit" disabled={identityForm.processing} className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50">Salvar Imagens</button>
                        </div>
                    </form>
                </Card>

                {/* Profile Form */}
                <Card>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Perfil do Estabelecimento</h3>
                        <p className="text-sm text-text-muted">Informações básicas de contato e endereço.</p>
                    </div>
                    <form onSubmit={submitProfile} className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <Label>Nome da Pizzaria</Label>
                                <input type="text" value={storeForm.data.name} onChange={e => storeForm.setData('name', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                            </div>
                            <div>
                                <Label>Telefone / WhatsApp</Label>
                                <input type="text" value={storeForm.data.phone} onChange={e => storeForm.setData('phone', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <Label>Endereço Completo</Label>
                                <input type="text" value={storeForm.data.address} onChange={e => storeForm.setData('address', e.target.value)} className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <Label>Breve Descrição (Slogan)</Label>
                                <textarea value={storeForm.data.description} onChange={e => storeForm.setData('description', e.target.value)} rows="2" className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary/50 outline-none resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-border-subtle">
                            <button type="submit" disabled={storeForm.processing} className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50">Salvar Perfil</button>
                        </div>
                    </form>
                </Card>
            </div>

            <div className="lg:col-span-5">
                {/* Opening Hours */}
                <Card>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-1">Horário de Funcionamento</h3>
                        <p className="text-sm text-text-muted">Defina quando a loja aceita pedidos.</p>
                    </div>
                    <form onSubmit={submitHours} className="space-y-3">
                        {days.map(day => (
                            <div key={day.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-background-dark/50">
                                <div className="w-24 text-xs font-bold text-white uppercase">{day.name}</div>
                                <div className="flex flex-1 items-center gap-2">
                                    {!hoursForm.data.hours[day.id]?.is_closed ? (
                                        <>
                                            <input type="time" value={hoursForm.data.hours[day.id]?.open} onChange={e => hoursForm.setData('hours', { ...hoursForm.data.hours, [day.id]: { ...hoursForm.data.hours[day.id], open: e.target.value } })} className="flex-1 bg-surface border border-border-subtle rounded-lg px-2 py-1 text-xs text-white focus:border-primary outline-none" />
                                            <span className="text-text-muted text-[10px]">até</span>
                                            <input type="time" value={hoursForm.data.hours[day.id]?.close} onChange={e => hoursForm.setData('hours', { ...hoursForm.data.hours, [day.id]: { ...hoursForm.data.hours[day.id], close: e.target.value } })} className="flex-1 bg-surface border border-border-subtle rounded-lg px-2 py-1 text-xs text-white focus:border-primary outline-none" />
                                        </>
                                    ) : (
                                        <span className="flex-1 text-[10px] font-bold text-red-400/70 uppercase text-center py-1 bg-red-400/5 rounded-lg border border-red-400/10 tracking-widest">Fechado o dia todo</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => hoursForm.setData('hours', { ...hoursForm.data.hours, [day.id]: { ...hoursForm.data.hours[day.id], is_closed: !hoursForm.data.hours[day.id]?.is_closed } })} className={`material-symbols-outlined text-[20px] transition-colors ${hoursForm.data.hours[day.id]?.is_closed ? 'text-red-400' : 'text-text-muted hover:text-white'}`}>
                                    {hoursForm.data.hours[day.id]?.is_closed ? 'block' : 'schedule'}
                                </button>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4 border-t border-border-subtle">
                            <button type="submit" disabled={hoursForm.processing} className="w-full py-3 bg-surface border border-border-subtle text-text-muted hover:text-white hover:border-border-subtle-hover text-sm font-bold rounded-xl transition-all disabled:opacity-50">Atualizar Horários</button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
