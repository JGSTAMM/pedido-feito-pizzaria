import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { norm } from '@/utils/normalize';

/**
 * A searchable select component for neighborhoods.
 * Shows a list of known neighborhoods grouped by city with a search filter.
 * Enables manual typing with a fixed fee warning.
 */
export function NeighborhoodSearchSelect({
    neighborhoods = [],
    selectedId,
    onChangeSelectedId,
    customName,
    onChangeCustomName,
    t,
    fieldClassName = "",
    error = false
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isManualMode = selectedId === 'custom';

    const handleSelect = useCallback(
        (neighborhood) => {
            onChangeSelectedId(neighborhood.id);
            onChangeCustomName('');
            setIsOpen(false);
            setSearchQuery('');
        },
        [onChangeSelectedId, onChangeCustomName]
    );

    const handleTypeManually = useCallback(() => {
        onChangeSelectedId('custom');
        setIsOpen(false);
    }, [onChangeSelectedId]);

    const filteredNeighborhoods = useMemo(() => {
        return neighborhoods.filter((n) =>
            norm(n.name).includes(norm(searchQuery)) ||
            norm(n.city || '').includes(norm(searchQuery))
        );
    }, [neighborhoods, searchQuery]);

    const groupedNeighborhoods = useMemo(() => {
        return filteredNeighborhoods.reduce((acc, curr) => {
            const city = curr.city || 'Outros';
            if (!acc[city]) acc[city] = [];
            acc[city].push(curr);
            return acc;
        }, {});
    }, [filteredNeighborhoods]);

    // Format currency
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    };

    const triggerLabel = useMemo(() => {
        if (!selectedId) return t('digital_menu.checkout.placeholders.neighborhood');
        if (selectedId === 'custom') return customName || t('digital_menu.checkout.placeholders.neighborhood');
        const found = neighborhoods.find((n) => String(n.id) === String(selectedId));
        return found ? found.name : t('digital_menu.checkout.placeholders.neighborhood');
    }, [selectedId, neighborhoods, t, customName]);

    if (isManualMode) {
        return (
            <div className="w-full">
                <input
                    type="text"
                    value={customName || ''}
                    onChange={(e) => onChangeCustomName(e.target.value)}
                    placeholder={t('digital_menu.checkout.type_custom_neighborhood') || 'Digite o nome do seu bairro...'}
                    aria-label={t('digital_menu.checkout.neighborhood')}
                    className={`${fieldClassName} ${error ? 'border-red-500' : ''}`}
                    autoFocus
                />
                <button
                    type="button"
                    onClick={() => {
                        onChangeSelectedId('');
                        onChangeCustomName('');
                        setSearchQuery('');
                    }}
                    className="mt-2 text-xs font-bold text-primary uppercase hover:text-primary-hover transition-colors"
                >
                    {t('digital_menu.checkout.back_to_list')}
                </button>
                <div className="mt-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400 font-medium leading-relaxed">
                        {t('digital_menu.checkout.custom_neighborhood_warning') || 'Taxa fixa sujeita a confirmação.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`text-left flex items-center justify-between min-h-[44px] ${fieldClassName} ${error ? 'border-red-500' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`block truncate ${!selectedId ? 'text-gray-400' : 'text-white'}`}>
                    {triggerLabel}
                </span>
                <span className="material-symbols-outlined text-gray-400 text-lg ml-2 shrink-0">
                    {isOpen ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className="absolute z-50 mt-2 w-full bg-[#12121A] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-3 border-b border-white/5 shrink-0 bg-[#12121A]">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('digital_menu.checkout.search_neighborhood')}
                                aria-label={t('digital_menu.checkout.search_neighborhood')}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto overscroll-contain">
                        {Object.keys(groupedNeighborhoods).length > 0 ? (
                            Object.keys(groupedNeighborhoods).map((city) => (
                                <div key={city}>
                                    <div className="sticky top-0 z-10 bg-[#12121A]/95 backdrop-blur px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary/70 border-y border-white/5 first:border-t-0">
                                        {city}
                                    </div>
                                    <ul className="py-1">
                                        {groupedNeighborhoods[city].map((n) => (
                                            <li key={n.id}>
                                                <button
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selectedId === n.id}
                                                    onClick={() => handleSelect(n)}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5 transition-colors group"
                                                >
                                                    <span className={`truncate mr-3 ${selectedId === n.id ? 'text-primary font-bold' : 'text-gray-300 group-hover:text-white'}`}>
                                                        {n.name}
                                                    </span>
                                                    <span className={`shrink-0 text-xs font-medium ${selectedId === n.id ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                        + {formatCurrency(n.delivery_fee)}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-4 text-sm text-gray-500 text-center">
                                {t('digital_menu.checkout.no_neighborhood_found')}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-white/5 shrink-0 bg-[#12121A]/80 backdrop-blur">
                        <button
                            type="button"
                            onClick={handleTypeManually}
                            className="w-full flex justify-center items-center gap-2 px-3 py-3 text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/10 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit_location_alt</span>
                            {t('digital_menu.checkout.type_manually')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NeighborhoodSearchSelect;
