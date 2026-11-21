import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';

export default function Profile({ user = {} }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installStatus, setInstallStatus] = useState('');

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallShortcut = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setInstallStatus(outcome === 'accepted' ? 'Atalho do App do Garçom instalado na tela inicial!' : '');
    };

    return (
        <MobileLayout activeTab="/waiter/profile">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background-dark/90 backdrop-blur-xl border-b border-border-subtle px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[22px]">person</span>
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-black tracking-tight">Perfil</h1>
                        <p className="text-text-muted text-xs font-medium">Dados da sua conta</p>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center py-4">
                    <div className="size-20 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/25 mb-4">
                        {user.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <h2 className="text-white text-xl font-black tracking-tight">{user.name}</h2>
                    <p className="text-text-muted text-sm capitalize">{user.role === 'waiter' ? 'Garçom' : user.role}</p>
                </div>

                {/* Install Waiter App Shortcut Card */}
                <div className="bg-gradient-to-br from-primary/15 to-purple-500/5 border border-primary/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[22px]">install_mobile</span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-black text-sm">Instalar App do Garçom no Celular</h3>
                            <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
                                Abre direto em Mesas e Balcão (sem cair no Cardápio Digital).
                            </p>
                        </div>
                    </div>

                    {deferredPrompt && (
                        <button
                            type="button"
                            onClick={handleInstallShortcut}
                            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_to_home_screen</span>
                            Instalar Atalho do Garçom Agora
                        </button>
                    )}

                    {installStatus && (
                        <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                            {installStatus}
                        </p>
                    )}

                    <div className="bg-black/25 rounded-xl p-3 space-y-1.5 text-[11px] text-text-muted leading-relaxed">
                        <p>
                            <strong className="text-white">Importante:</strong> se você já tinha um atalho antigo salvo na tela inicial, apague o ícone antigo antes de criar o novo.
                        </p>
                        <p>
                            <strong className="text-white">Android (Chrome):</strong> Menu (⋮) → <em>Adicionar à tela inicial / Instalar app</em> enquanto estiver nesta tela.
                        </p>
                        <p>
                            <strong className="text-white">iPhone (Safari):</strong> Botão <em>Compartilhar</em> → <em>Adicionar à Tela de Início</em>.
                        </p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                    <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex items-center gap-4">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">E-mail</p>
                            <p className="text-white font-medium text-sm truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="bg-surface border border-border-subtle rounded-2xl p-4 flex items-center gap-4">
                        <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Membro desde</p>
                            <p className="text-white font-medium text-sm">{user.created_at}</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Fees Link */}
                <Link
                    href="/neighborhoods"
                    className="w-full py-4 bg-surface hover:bg-white/5 text-white font-bold rounded-2xl border border-border-subtle transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-[20px] text-primary">two_wheeler</span>
                    Taxas de Tele-Entrega
                </Link>

                {/* Logout Button */}
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full py-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sair da Conta
                </Link>
            </div>
        </MobileLayout>
    );
}
