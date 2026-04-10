import React, { useState, useCallback } from 'react';

/**
 * A searchable select component for neighborhoods.
 * Shows a list of known neighborhoods with a search filter.
 * If the desired neighborhood is not found, allows manual ("custom") input.
 *
 * @param {object} props
 * @param {Array}  props.neighborhoods  - Array of { id, name } objects fetched from backend
 * @param {string} props.value          - Current selected/typed value
 * @param {function} props.onChange     - Callback (neighborhoodName) => void
 * @param {function} props.t            - i18n translation function
 */
export function NeighborhoodSearchSelect({ neighborhoods = [], value, onChange, t }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    const filteredNeighborhoods = neighborhoods.filter((n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = useCallback(
        (neighborhood) => {
            onChange(neighborhood.name);
            setIsOpen(false);
            setSearchQuery('');
            setIsManualMode(false);
        },
        [onChange]
    );

    const handleTypeManually = useCallback(() => {
        setIsManualMode(true);
        setIsOpen(false);
        onChange('');
    }, [onChange]);

    const handleManualChange = useCallback(
        (e) => {
            onChange(e.target.value);
        },
        [onChange]
    );

    if (isManualMode) {
        return (
            <div>
                <input
                    type="text"
                    value={value}
                    onChange={handleManualChange}
                    placeholder={t('digital_menu.checkout.neighborhood_placeholder')}
                    aria-label={t('digital_menu.checkout.neighborhood_label')}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                    type="button"
                    onClick={() => {
                        setIsManualMode(false);
                        setSearchQuery('');
                        onChange('');
                    }}
                    className="mt-1 text-xs text-cyan-400 underline"
                >
                    {t('digital_menu.checkout.back_to_list')}
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full text-left bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {value || t('digital_menu.checkout.select_neighborhood')}
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                    <div className="p-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('digital_menu.checkout.search_neighborhood')}
                            className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <ul className="max-h-48 overflow-y-auto">
                        {filteredNeighborhoods.length > 0 ? (
                            filteredNeighborhoods.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={value === n.name}
                                        onClick={() => handleSelect(n)}
                                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                                    >
                                        {n.name}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-2 text-sm text-gray-400">
                                {t('digital_menu.checkout.no_neighborhood_found')}
                            </li>
                        )}
                    </ul>

                    <div className="border-t border-gray-700 p-2">
                        <button
                            type="button"
                            onClick={handleTypeManually}
                            className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {t('digital_menu.checkout.type_manually')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NeighborhoodSearchSelect;
