import useI18n from '@/hooks/useI18n';
import { luccheseMenuTheme } from '../../theme/luccheseMenuTheme';

function resolveIsPopular(product) {
    return Boolean(product?.is_popular ?? product?.popular ?? product?.featured ?? false);
}

export default function ProductCardPremium({ product, formatCurrency, onAddToCart }) {
    const { t } = useI18n();
    const isPopular = resolveIsPopular(product);
    const imageUrl = product?.image_url || product?.imageUrl || null;

    return (
        <article className={`${luccheseMenuTheme.glass} group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30`}>
            <div className="relative aspect-[16/10] overflow-hidden border-b border-border-subtle bg-black/20">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product?.name || t('digital_menu.catalog.view_details')}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.2),rgba(10,10,11,0.6)_60%)]">
                        <span className="material-symbols-outlined text-3xl text-primary/90">local_pizza</span>
                    </div>
                )}

                {isPopular ? (
                    <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                        {t('digital_menu.catalog.popular_badge')}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-base font-bold text-white sm:text-lg">{product?.name}</h3>
                    <span className="shrink-0 text-base font-black text-primary sm:text-lg">
                        {formatCurrency(product?.price)}
                    </span>
                </div>

                {product?.description ? (
                    <p className={`mt-2 line-clamp-2 text-sm ${luccheseMenuTheme.textMuted}`}>
                        {product.description}
                    </p>
                ) : (
                    <p className={`mt-2 line-clamp-2 text-sm ${luccheseMenuTheme.textMuted}`}>
                        {t('digital_menu.catalog.view_details')}
                    </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle bg-white/[0.02] px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.08]"
                    >
                        {t('digital_menu.catalog.view_details')}
                    </button>
                    <button
                        type="button"
                        className={`${luccheseMenuTheme.primary} inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-bold uppercase tracking-wide transition-all`}
                        onClick={() => onAddToCart(product)}
                    >
                        {t('digital_menu.catalog.quick_add')}
                    </button>
                </div>
            </div>
        </article>
    );
}
