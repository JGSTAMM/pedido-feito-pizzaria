import { Link, usePage } from '@inertiajs/react';
import useI18n from '@/hooks/useI18n';
import { useCart } from '../../hooks/useCart';

export default function BottomNav({ onOpenProfile }) {
    const { t } = useI18n();
    const { url } = usePage();
    const { cartItemCount } = useCart();

    const isActive = (path) => {
        if (path === '/menu' && url === '/menu') return true;
        if (path !== '/menu' && url.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe w-full border-t border-white/5 bg-[#131118]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[#131118]/70">
            <nav className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
                <Link
                    href="/menu"
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/menu') ? 'text-primary' : 'text-text-muted hover:text-white'
                        }`}
                >
                    <span className="material-symbols-outlined text-[22px] font-light leading-none block">home</span>
                    <span className="text-[10px] font-bold">{t('nav.home') || 'Início'}</span>
                </Link>

                <Link
                    href="/menu/orders"
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/menu/orders') ? 'text-primary' : 'text-text-muted hover:text-white'
                        }`}
                >
                    <span className="material-symbols-outlined text-[22px] font-light leading-none block">receipt_long</span>
                    <span className="text-[10px] font-bold">{t('nav.orders') || 'Pedidos'}</span>
                </Link>

                <Link
                    href="/menu/cart"
                    className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/menu/cart') ? 'text-primary' : 'text-text-muted hover:text-white'
                        }`}
                >
                    <div className="relative flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-[22px] font-light leading-none block mt-[-1px]">shopping_bag</span>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white shadow-lg ring-2 ring-[#131118]">
                                {cartItemCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold">{t('digital_menu.cart.title') || 'Carrinho'}</span>
                </Link>

                <Link
                    href="/menu/store-profile"
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive('/menu/store-profile') ? 'text-primary' : 'text-text-muted hover:text-white'
                        }`}
                >
                    <span className="material-symbols-outlined text-[22px] font-light leading-none block">person</span>
                    <span className="text-[10px] font-bold">{t('nav.profile') || 'Perfil'}</span>
                </Link>
            </nav>
        </div>
    );
}
