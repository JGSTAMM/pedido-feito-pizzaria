import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MobileLayout from '@/Layouts/MobileLayout';
import TabEntregas from '@/Pages/Settings/Components/TabEntregas';
import { Toast } from '@/Pages/Settings/Components/Shared';

export default function NeighborhoodsIndex({ neighborhoods = [], deliveryFeeSecurity = {} }) {
    const { auth, flash } = usePage().props;
    const role = String(auth?.user?.role || '').toLowerCase();
    const isWaiter = role === 'waiter' || role === 'garcom';

    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (flash?.success) setToast({ message: flash.success, type: 'success' });
        if (flash?.error) setToast({ message: flash.error, type: 'error' });
    }, [flash]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const content = (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl w-full mx-auto">
            <Toast message={toast?.message} type={toast?.type} />
            <TabEntregas neighborhoods={neighborhoods} deliveryFeeSecurity={deliveryFeeSecurity} />
        </div>
    );

    if (isWaiter) {
        return <MobileLayout activeTab="/waiter/profile">{content}</MobileLayout>;
    }

    return <AppLayout>{content}</AppLayout>;
}
