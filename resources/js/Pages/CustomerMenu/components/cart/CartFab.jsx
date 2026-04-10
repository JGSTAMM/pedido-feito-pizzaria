import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

export default function CartFab({ cartItemCount, cartTotal, onClick }) {
    const { t, formatCurrency } = useI18n();

    return (
        <button
            type="button"
            onClick={onClick}
            className={`${luccheseMenuTheme.primary} fixed bottom-5 right-5 z-40 flex h-14 items-center gap-3 rounded-full px-4 font-semibold transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark sm:bottom-8 sm:right-8 sm:px-5`}
        >
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-sm font-black text-primary">
                {cartItemCount}
            </span>
            <span className="flex flex-col items-start leading-none">
                <span className="text-[10px] uppercase tracking-wider text-white/85">{t('digital_menu.cart.title')}</span>
                <span className="text-sm font-black text-white">{formatCurrency(cartTotal)}</span>
            </span>
        </button>
    );
}
