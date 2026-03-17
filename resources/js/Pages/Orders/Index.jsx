import { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { norm } from '@/utils/normalize';
import AppLayout from '@/Layouts/AppLayout';
import useI18n from '@/hooks/useI18n';

const getStatusConfig = (t) => ({
    pending: { label: t('orders.status.pending'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: 'schedule' },
    preparing: { label: t('orders.status.preparing'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'skillet' },
    ready: { label: t('orders.status.ready'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: 'done_all' },
    paid: { label: t('orders.status.paid'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'paid' },
    delivered: { label: t('orders.status.delivered'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'local_shipping' },
    completed: { label: t('orders.status.completed'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'check_circle' },
    accepted: { label: t('orders.status.accepted'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: 'thumb_up' },
    rejected: { label: t('orders.status.rejected'), color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: 'cancel' },
    awaiting_payment: { label: t('orders.status.awaiting_payment'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: 'hourglass_top' },
    paid_online: { label: t('orders.status.paid_online'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: 'cloud_done' },
});

const getTypeConfig = (t) => ({
    pickup: { label: t('orders.types.pickup'), icon: 'storefront' },
    delivery: { label: t('orders.types.delivery'), icon: 'delivery_dining' },
    salon: { label: t('orders.types.salon'), icon: 'restaurant' },
    dine_in: { label: t('orders.types.dine_in'), icon: 'restaurant' },
});

function StatusBadge({ status, statusConfig }) {
    const config = statusConfig[status] || { label: status, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: 'help' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.label}
        </span>
    );
}

function StatCard({ icon, label, value, valueColor = 'text-white' }) {
    return (
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 flex items-center gap-4 hover:border-primary/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
            <div>
                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</p>
            </div>
        </div>
    );
}

function OrderDetailsModal({ order, onClose, t, statusConfig, typeConfig, formatCurrency }) {
    if (!order) return null;
    const typeInfo = typeConfig[order.type] || { label: order.type, icon: 'help' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/80 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border-subtle shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-white tracking-tight">{t('orders.modal.orderCode')} #{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</h2>
                            <StatusBadge status={order.status} statusConfig={statusConfig} />
                        </div>
                        <p className="text-sm text-text-muted">{order.created_at}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-colors rounded-xl hover:bg-surface-hover">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background-dark p-4 rounded-xl border border-border-subtle">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">{t('orders.table.customer')}</span>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">person</span>
                                <span className="text-white font-medium">{order.customer_name}</span>
                            </div>
                        </div>
                        <div className="bg-background-dark p-4 rounded-xl border border-border-subtle">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">{t('orders.modal.deliveryDetails')}</span>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-emerald-400">{typeInfo.icon}</span>
                                <span className="text-white font-medium">
                                    {typeInfo.label} {order.table_name && `- ${t('orders.table.table')} ${order.table_name}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-4">{t('orders.modal.itemsTitle', { count: order.items_count })}</h3>
                        <div className="space-y-3">
                            {order.items?.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-background-dark rounded-xl border border-border-subtle">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded bg-surface border border-border-subtle flex items-center justify-center font-bold text-primary font-mono text-sm shadow-inner">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{item.name}</p>
                                            {item.notes && <p className="text-xs text-amber-400/80 mt-1 italic">{t('orders.modal.notesPrefix')}: {item.notes}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold font-mono">{formatCurrency(item.total_price)}</p>
                                        {item.quantity > 1 && <p className="text-xs text-text-muted">{t('orders.modal.eachPrice', { price: formatCurrency(item.unit_price) })}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-subtle bg-black/20 flex items-center justify-between rounded-b-2xl">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted">payments</span>
                        <span className="text-sm text-text-muted capitalize">{order.payment_method}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-text-muted mr-3">{t('orders.modal.totalOrder')}</span>
                        <span className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Index({ orders = [], stats = {} }) {
    const { t, formatCurrency } = useI18n();
    const statusConfig = getStatusConfig(t);
    const typeConfig = getTypeConfig(t);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const filteredOrders = useMemo(() => {
        let items = orders;

        if (statusFilter !== 'all') {
            if (statusFilter === 'paid') {
                items = items.filter(o => o.is_paid);
            } else {
                items = items.filter(o => o.status === statusFilter);
            }
        }

        if (searchTerm.trim()) {
            const term = norm(searchTerm);
            items = items.filter(o =>
                norm(o.customer_name).includes(term) ||
                String(o.id).includes(term)
            );
        }

        return items;
    }, [orders, statusFilter, searchTerm]);

    const statusTabs = [
        { key: 'all', label: t('orders.filters.all'), count: orders.length },
        { key: 'pending', label: t('orders.filters.pending'), count: orders.filter(o => o.status === 'pending').length },
        { key: 'preparing', label: t('orders.filters.preparing'), count: orders.filter(o => o.status === 'preparing').length },
        { key: 'ready', label: t('orders.filters.ready'), count: orders.filter(o => o.status === 'ready').length },
        { key: 'paid', label: t('orders.filters.paid'), count: orders.filter(o => o.is_paid).length },
    ];

    return (
        <AppLayout>
            {/* Page Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Page Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{t('orders.header.title')}</h1>
                            <p className="text-text-muted text-sm mt-1">{t('orders.header.subtitle')}</p>
                        </div>
                        <Link
                            href="/pos"
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            {t('orders.actions.newOrder')}
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <StatCard icon="receipt_long" label={t('orders.stats.ordersToday')} value={stats.total_today ?? 0} />
                        <StatCard icon="payments" label={t('orders.stats.revenueToday')} value={formatCurrency(stats.revenue_today ?? 0)} valueColor="text-emerald-soft" />
                        <StatCard icon="pending_actions" label={t('orders.stats.inProgress')} value={stats.pending_count ?? 0} valueColor="text-amber-400" />
                        <StatCard icon="check_circle" label={t('orders.stats.completedToday')} value={stats.completed_today ?? 0} valueColor="text-primary" />
                    </div>

                    {/* Filters Bar */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Status Tabs */}
                        <div className="flex gap-2 overflow-x-auto">
                            {statusTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${statusFilter === tab.key
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-white border border-transparent'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs ${statusFilter === tab.key ? 'bg-primary/30' : 'bg-surface-hover'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                            <input
                                className="bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 w-72 transition-all"
                                placeholder={t('orders.search.placeholder')}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="px-8 pb-8">
                    <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[80px_1fr_140px_120px_140px_140px_160px] gap-4 px-6 py-4 border-b border-border-subtle bg-[#111118]/50">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">#</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.customer')}</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.type')}</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.items')}</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.total')}</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.status')}</span>
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{t('orders.table.date')}</span>
                        </div>

                        {/* Table Body */}
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                                <span className="material-symbols-outlined text-4xl mb-3">inbox</span>
                                <p className="font-semibold">{t('orders.empty.title')}</p>
                                <p className="text-sm mt-1">
                                    {searchTerm ? t('orders.empty.searchHint') : t('orders.empty.defaultHint')}
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order, idx) => {
                                const typeInfo = typeConfig[order.type] || { label: order.type, icon: 'help' };
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`grid grid-cols-[80px_1fr_140px_120px_140px_140px_160px] gap-4 px-6 py-4 items-center hover:bg-surface-hover transition-colors cursor-pointer group ${idx < filteredOrders.length - 1 ? 'border-b border-border-subtle' : ''
                                            }`}
                                    >
                                        {/* Order ID */}
                                        <span className="text-sm font-bold text-primary font-mono">#{order.short_code || String(order.id).substring(0, 5).toUpperCase()}</span>

                                        {/* Customer */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/30 to-purple-400/30 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                {order.customer_name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{order.customer_name}</p>
                                                {order.table_name && (
                                                    <p className="text-xs text-text-muted">{t('orders.table.table')} {order.table_name}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Type */}
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-text-muted">{typeInfo.icon}</span>
                                            <span className="text-sm text-text-muted">{typeInfo.label}</span>
                                        </div>

                                        {/* Items Count */}
                                        <span className="text-sm text-white font-mono">{order.items_count} {order.items_count === 1 ? t('orders.table.itemSingular') : t('orders.table.itemPlural')}</span>

                                        {/* Total */}
                                        <span className="text-sm font-bold text-emerald-soft font-mono">{formatCurrency(order.total_amount)}</span>

                                        {/* Status */}
                                        <StatusBadge status={order.status} statusConfig={statusConfig} />

                                        {/* Date */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-text-muted">{order.created_at}</p>
                                                <p className="text-xs text-text-muted/60">{order.created_at_relative}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-[18px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                chevron_right
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 px-2">
                        <p className="text-sm text-text-muted">
                            {t('orders.footer.showing', { filtered: filteredOrders.length, total: orders.length })}
                        </p>
                    </div>
                </div>
            </div>
            {/* Modal */}
            <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} t={t} statusConfig={statusConfig} typeConfig={typeConfig} formatCurrency={formatCurrency} />
        </AppLayout>
    );
}
