import { useEffect, useState } from 'react';

export default function AddressSelector({ currentAddress, onChangeAddress, onOpenProfile }) {
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    // Sync from localStorage
    useEffect(() => {
        const loadAddresses = () => {
            try {
                const stored = localStorage.getItem('customerAddresses');
                if (stored) {
                    setSavedAddresses(JSON.parse(stored));
                }
                const selected = localStorage.getItem('selectedAddressId');
                if (selected) {
                    setSelectedId(selected);
                }
            } catch (e) {
                console.error('Error loading addresses', e);
            }
        };

        loadAddresses();

        // Optional: listen to storage events if profile modal is edited in another tab/window
        window.addEventListener('storage', loadAddresses);

        // Also setup an interval to sync just in case it changes within the same React tree without context
        const interval = setInterval(loadAddresses, 1000);
        return () => {
            window.removeEventListener('storage', loadAddresses);
            clearInterval(interval);
        };
    }, []);

    const selectedAddress = savedAddresses.find(a => String(a.id) === String(selectedId));

    // Notice we emit onChangeAddress upstream if we see a mismatch,
    // so checkout form's values stay in sync.
    useEffect(() => {
        if (selectedAddress) {
            const formatted = `${selectedAddress.street}, ${selectedAddress.number}${selectedAddress.complement ? ` - ${selectedAddress.complement}` : ''} - ${selectedAddress.neighborhood}`;
            if (formatted !== currentAddress) {
                onChangeAddress(formatted, selectedAddress.neighborhoodId);
            }
        }
    }, [selectedAddress, currentAddress, onChangeAddress]);

    return (
        <div className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-1 block">Endereço de Entrega</span>
                {selectedAddress ? (
                    <div>
                        <p className="text-sm font-bold text-white truncate italic">
                            {selectedAddress.street}, {selectedAddress.number}
                        </p>
                        <p className="text-xs text-text-muted mt-1 uppercase font-bold tracking-wider">
                            {selectedAddress.neighborhood} {selectedAddress.complement && `• ${selectedAddress.complement}`}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-text-muted italic">Nenhum endereço selecionado</p>
                )}
            </div>

            <button
                type="button"
                onClick={onOpenProfile}
                className="shrink-0 h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
                {selectedAddress ? 'Trocar' : 'Adicionar Endereço'}
            </button>
        </div>
    );
}
