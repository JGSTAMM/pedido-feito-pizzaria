import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';

const navTabs = [
    { href: '/waiter', icon: 'table_restaurant', labelKey: 'nav.tables' },
    { href: '/waiter/orders', icon: 'receipt_long', labelKey: 'nav.tabsOrders' },
    { href: '/waiter/profile', icon: 'person', labelKey: 'nav.profile' },
];

export default function MobileLayout({ children, activeTab = '/waiter' }) {
    const { url } = usePage();
    const { t } = useI18n();

    const isActive = (href) => {
        if (href === '/waiter') return url === '/waiter';
        return url.startsWith(href);
    };

    return (
        <div className="bg-background-dark text-white h-[100dvh] flex flex-col overflow-hidden selection:bg-primary selection:text-white">
            {/* Main Content — scrollable */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </main>

            {/* ─── Bottom Navigation Bar ─── */}
            <nav className="flex-shrink-0 bg-[#111118]/95 backdrop-blur-xl border-t border-border-subtle"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}>
                <div className="flex items-stretch justify-around h-16">
                    {navTabs.map((tab) => {
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 relative ${active ? 'text-primary' : 'text-text-muted active:text-white'
                                    }`}
                            >
                                {/* Active Indicator */}
                                {active && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                                )}

                                <span className={`material-symbols-outlined transition-all duration-200 ${active ? 'text-[28px] scale-110' : 'text-[24px]'
                                    }`}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[10px] font-bold tracking-wide uppercase transition-all ${active ? 'text-primary' : 'text-text-muted'
                                    }`}>
                                    {t(tab.labelKey)}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
