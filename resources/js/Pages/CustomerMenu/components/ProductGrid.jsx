import React from 'react';

export default function ProductGrid({ categories, t, formatCurrency, onAddToCart }) {
    if (!categories?.length) {
        return (
            <section className="rounded-2xl border border-gray-700 bg-gray-800 p-6 text-center text-gray-300">
                <p className="font-medium text-white">{t('digital_menu.catalog.empty_title')}</p>
                <p className="mt-1 text-sm text-gray-400">{t('digital_menu.catalog.empty_description')}</p>
            </section>
        );
    }

    return (
        <div className="space-y-8">
            {categories.map((category) => (
                <section key={category.id} className="space-y-4">
                    <header>
                        <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                        {category.description ? (
                            <p className="text-sm text-gray-400">{category.description}</p>
                        ) : null}
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                        {(category.products ?? []).map((product) => (
                            <article
                                key={product.id}
                                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full"
                            >
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                                        <span className="text-emerald-400 font-bold">
                                            {formatCurrency(product.price)}
                                        </span>
                                    </div>
                                    {product.description ? (
                                        <p className="mt-2 text-sm text-gray-400">{product.description}</p>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="mt-auto w-full inline-flex items-center justify-center rounded-xl h-11 px-4 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800"
                                        onClick={() => onAddToCart(product)}
                                    >
                                        {t('digital_menu.cart.add_item')}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
