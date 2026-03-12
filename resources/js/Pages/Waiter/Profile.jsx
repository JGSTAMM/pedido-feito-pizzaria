import { Link } from '@inertiajs/react';
import MobileLayout from '@/Layouts/MobileLayout';

export default function Profile({ user = {} }) {

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
                <div className="flex flex-col items-center py-6">
                    <div className="size-20 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/25 mb-4">
                        {user.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <h2 className="text-white text-xl font-black tracking-tight">{user.name}</h2>
                    <p className="text-text-muted text-sm capitalize">{user.role === 'waiter' ? 'Garçom' : user.role}</p>
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
