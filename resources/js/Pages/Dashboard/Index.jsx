import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import useI18n from '@/hooks/useI18n';

function StatCard({ icon, label, value, valueColor = 'text-white', trend = null, trendColor = 'text-emerald-400' }) {
    return (
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-2 relative overflow-hidden group" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {label}
            </p>
            <div className="flex items-end gap-3 mt-1">
                <h3 className={`${valueColor} text-2xl font-bold tracking-tight`}>{value}</h3>
                {trend && (
                    <span className={`mb-0.5 px-2 py-0.5 bg-emerald-500/10 ${trendColor} text-xs font-bold rounded-full`}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Index({ stats = {}, recentOrders = [] }) {
    const { t, formatCurrency } = useI18n();

    const statusConfig = {
        pending: { label: t('status.pending'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: 'schedule' },
        preparing: { label: t('status.preparing'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'skillet' },
        ready: { label: t('status.ready'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: 'done_all' },
        paid: { label: t('status.paid'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'paid' },
        delivered: { label: t('status.delivered'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'local_shipping' },
    };

    const revDiff = stats.revenue_today - (stats.revenue_yesterday || 0);
    const revTrend = stats.revenue_yesterday > 0
        ? `${revDiff >= 0 ? '+' : ''}${((revDiff / stats.revenue_yesterday) * 100).toFixed(0)}%`
        : null;

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">dashboard</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">{t('dashboard.title')}</h2>
                            <p className="text-text-muted text-xs">{t('dashboard.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${stats.cash_register_open ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            {stats.cash_register_open ? t('dashboard.cashRegisterOpen') : t('dashboard.cashRegisterClosed')}
                        </div>
                    </div>
                </header>

                <div className="p-10 flex flex-col gap-8">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatCard icon="payments" label={t('dashboard.stats.revenueToday')} value={formatCurrency(stats.revenue_today ?? 0)} valueColor="text-emerald-400" trend={revTrend} />
                        <StatCard icon="receipt_long" label={t('dashboard.stats.ordersToday')} value={stats.orders_today ?? 0} />
                        <StatCard icon="pending_actions" label={t('dashboard.stats.inProgress')} value={stats.active_orders ?? 0} valueColor="text-amber-400" />
                        <StatCard icon="inventory_2" label={t('dashboard.stats.activeProducts')} value={(stats.products_count ?? 0) + (stats.flavors_count ?? 0)} valueColor="text-primary" />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/pos" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
                            </div>
                            <span className="text-sm font-bold text-white">{t('dashboard.quickActions.openPos')}</span>
                        </Link>
                        <Link href="/orders" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                            </div>
                            <span className="text-sm font-bold text-white">{t('dashboard.quickActions.viewOrders')}</span>
                        </Link>
                        <Link href="/kds" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">skillet</span>
                            </div>
                            <span className="text-sm font-bold text-white">{t('dashboard.quickActions.kitchenKds')}</span>
                        </Link>
                        <Link href="/floor" className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-hover hover:border-primary/30 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined text-[24px]">table_restaurant</span>
                            </div>
                            <span className="text-sm font-bold text-white">{t('dashboard.quickActions.floorMap')}</span>
                        </Link>
                    </div>

                    {/* Recent Orders */}
                    <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                            <h3 className="text-white text-lg font-bold">{t('dashboard.recentOrders.title')}</h3>
                            <Link href="/orders" className="text-primary text-sm font-bold hover:underline">{t('dashboard.recentOrders.viewAll')}</Link>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
                                <p className="text-sm">{t('dashboard.recentOrders.empty')}</p>
                            </div>
                        ) : (
                            recentOrders.map((order, idx) => {
                                const st = statusConfig[order.status] || { label: t('common.unknown'), color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: 'help' };
                                return (
                                    <div key={order.id} className={`flex items-center justify-between px-6 py-4 hover:bg-surface-hover transition-colors ${idx < recentOrders.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-primary font-mono">#{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</span>
                                            <span className="text-sm text-white font-medium">{order.customer_name}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(order.total_amount)}</span>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${st.color}`}>
                                                <span className="material-symbols-outlined text-[14px]">{st.icon}</span>
                                                {st.label}
                                            </span>
                                            <span className="text-xs text-text-muted">{order.created_at}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
