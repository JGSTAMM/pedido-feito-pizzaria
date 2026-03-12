import { Link, usePage } from '@inertiajs/react';

const navItems = [
    { href: '/pos', icon: 'point_of_sale', label: 'PDV' },
    { href: '/dashboard', icon: 'dashboard', label: 'Painel de Controle' },
    { href: '/orders', icon: 'receipt_long', label: 'Pedidos' },
    { href: '/kds', icon: 'skillet', label: 'Cozinha (KDS)' },
    { href: '/floor', icon: 'table_restaurant', label: 'Mapa do Salão' },
    { href: '/cash-register', icon: 'point_of_sale', label: 'Caixa' },
];

const configItems = [
    { href: '/products', icon: 'inventory_2', label: 'Produtos' },
    { href: '/flavors', icon: 'local_pizza', label: 'Sabores' },
    { href: '/sizes', icon: 'straighten', label: 'Tamanhos' },
    { href: '/reports', icon: 'analytics', label: 'Relatórios' },
    { href: '/settings', icon: 'settings', label: 'Configurações' },
];

function SidebarLink({ href, icon, label, active }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                ? 'bg-primary/20 text-primary border border-primary/20'
                : 'hover:bg-surface text-text-muted hover:text-white group'
                }`}
        >
            <span className={`material-symbols-outlined ${!active ? 'group-hover:text-primary transition-colors' : ''}`}>
                {icon}
            </span>
            <span className="font-medium text-sm">{label}</span>
        </Link>
    );
}

export default function AppLayout({ children, topBar = null }) {
    const { url, props } = usePage();
    const appName = props.appName || 'Pedido Feito';

    // Determine active route from current URL
    const isActive = (href) => {
        if (href === '/pos') return url.startsWith('/pos');
        if (href === '/dashboard') return url === '/dashboard' || url === '/';
        return url.startsWith(href);
    };

    return (
        <div className="bg-background-dark text-white h-screen flex overflow-hidden selection:bg-primary selection:text-white">
            {/* Sidebar Navigation */}
            <nav className="w-[240px] flex-shrink-0 flex flex-col bg-[#111118] border-r border-border-subtle h-full">
                {/* Brand */}
                <div className="p-6 pb-8 border-b border-border-subtle">
                    <h1 className="text-white text-xl font-bold tracking-tight">
                        {appName || 'Pedido Feito'}
                    </h1>
                    <p className="text-text-muted text-xs mt-1 font-medium">System Admin v2.0</p>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    {navItems.map((item) => (
                        <SidebarLink
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            active={isActive(item.href)}
                        />
                    ))}

                    <div className="pt-4 mt-4 border-t border-border-subtle">
                        <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Configurações
                        </p>
                        {configItems.map((item) => (
                            <SidebarLink
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                active={isActive(item.href)}
                            />
                        ))}
                    </div>
                </div>

                {/* User Profile and Logout */}
                <div className="p-4 border-t border-border-subtle flex items-center justify-between gap-2">
                    <Link href="/settings" className="flex items-center gap-3 p-2 flex-1 rounded-xl hover:bg-surface transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                            {props.auth?.user?.name ? props.auth.user.name.substring(0,2).toUpperCase() : 'AD'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{props.auth?.user?.name || 'Admin'}</p>
                            <p className="text-xs text-emerald-soft truncate">Online</p>
                        </div>
                    </Link>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="p-2 rounded-xl text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                        title="Sair do Sistema"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 bg-background-dark">
                {/* Optional Top Bar (pages like POS customize this) */}
                {topBar && topBar}

                {/* Page Content */}
                {children}
            </main>
        </div>
    );
}
