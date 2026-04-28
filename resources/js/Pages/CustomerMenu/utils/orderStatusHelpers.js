/**
 * Helper functions and configurations for order status display.
 */

export const TYPE_CONFIG = {
    pickup: { label: 'Retirada no Balcão', icon: '🏪' },
    delivery: { label: 'Delivery', icon: '🛵' },
    salon: { label: 'Mesa (Salão)', icon: '🍽️' },
    dine_in: { label: 'Mesa (Salão)', icon: '🍽️' },
};

export const getStatusConfig = (t, isOnlinePaid = false) => ({
    pending: { 
        label: isOnlinePaid ? `✅ Pagamento Aprovado! ${t('digital_menu.payment.labels.pending')}` : t('digital_menu.payment.labels.pending'), 
        icon: isOnlinePaid ? '✅' : '📋', 
        color: isOnlinePaid ? 'text-emerald-400' : 'text-amber-400', 
        bg: isOnlinePaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20' 
    },
    awaiting_payment: { label: t('digital_menu.payment.labels.awaiting_payment'), icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10  border-amber-500/20' },
    accepted: { label: t('digital_menu.payment.labels.accepted'), icon: '👩‍🍳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    paid_online: { label: t('digital_menu.payment.labels.paid_online'), icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    paid: { label: t('digital_menu.payment.labels.paid_online'), icon: '💳', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    preparing: { label: t('digital_menu.payment.labels.preparing'), icon: '🍕', color: 'text-blue-400', bg: 'bg-blue-500/10   border-blue-500/20' },
    ready: { label: t('digital_menu.payment.labels.ready'), icon: '🔔', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    delivered: { label: t('digital_menu.payment.labels.delivered'), icon: '🎉', color: 'text-white', bg: 'bg-white/5       border-white/10' },
    completed: { label: t('digital_menu.payment.labels.delivered'), icon: '⭐', color: 'text-white', bg: 'bg-white/5       border-white/10' },
    rejected: { label: t('digital_menu.payment.labels.rejected'), icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/20' },
    cancelled: { label: t('digital_menu.payment.labels.cancelled'), icon: '🚫', color: 'text-red-400', bg: 'bg-red-500/10    border-red-500/20' },
});

export const getSteps = (t) => [
    { key: 'received', label: t('digital_menu.payment.stepper.received'), icon: '📋' },
    { key: 'confirmed', label: t('digital_menu.payment.stepper.confirmed'), icon: '✅' },
    { key: 'preparing', label: t('digital_menu.payment.stepper.preparing'), icon: '🍕' },
    { key: 'ready', label: t('digital_menu.payment.stepper.ready'), icon: '🔔' },
    { key: 'delivered', label: t('digital_menu.payment.stepper.delivered'), icon: '🎉' },
];

export function resolveStatusKey(status) {
    const s = String(status || '').toLowerCase();
    if (['paid', 'paid_online'].includes(s)) return 'paid_online';
    if (s === 'pending') return 'pending';
    if (s === 'accepted') return 'accepted';
    if (s === 'rejected') return 'rejected';
    if (s === 'preparing') return 'preparing';
    if (s === 'ready') return 'ready';
    if (['delivered', 'completed'].includes(s)) return 'delivered';
    if (s === 'cancelled') return 'cancelled';
    return 'awaiting_payment';
}

export function resolveActiveStep(statusKey) {
    const map = {
        awaiting_payment: 0,
        paid_online: 1,
        pending: 1,
        accepted: 1,
        preparing: 2,
        ready: 3,
        delivered: 4,
    };
    return map[statusKey] ?? 0;
}
