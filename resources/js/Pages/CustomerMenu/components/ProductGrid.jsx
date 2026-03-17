import React from 'react';

function formatCurrency(value) {
    const numericValue = Number(value ?? 0);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numericValue);
}

export default function ProductGrid({ categories, t }) {
    if (!categories?.length) {
        return (
            <section className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
                <p className="font-medium">{t('digital_menu.catalog.empty_title')}</p>
                <p className="mt-1 text-sm">{t('digital_menu.catalog.empty_description')}</p>
            </section>
        );
    }

    return (
        <div className="space-y-8">
            {categories.map((category) => (
                <section key={category.id} className="space-y-4">
                    <header>
                        <h2 className="text-xl font-semibold text-slate-900">{category.name}</h2>
                        {category.description ? (
                            <p className="text-sm text-slate-600">{category.description}</p>
                        ) : null}
                    </header>

                    <div className="grid gap-4 md:grid-cols-2">
                        {(category.products ?? []).map((product) => (
                            <article
                                key={product.id}
                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-base font-medium text-slate-900">{product.name}</h3>
                                    <span className="text-sm font-semibold text-emerald-700">
                                        {formatCurrency(product.price)}
                                    </span>
                                </div>
                                {product.description ? (
                                    <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                                ) : null}
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
