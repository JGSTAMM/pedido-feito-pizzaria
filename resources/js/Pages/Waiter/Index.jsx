import { useState, useEffect, useCallback, useRef } from 'react';
import MobileLayout from '@/Layouts/MobileLayout';
import TableOrderDrawer from '@/Pages/Floor/TableOrderDrawer';

export default function Index({
    tables = [],
    stats = {},
    products = [],
    pizzaFlavors = [],
    pizzaSizes = [],
    categories = [],
    borderOptions = [],
    userName = 'Garçom',
}) {
    const [selectedTable, setSelectedTable] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const lastScrollUpdate = useRef(0);

    // Throttled scroll listener with robust hysteresis
    const handleScroll = useCallback((e) => {
        const scrollTop = e.target.scrollTop;
        const now = Date.now();
        
        // Throttle state updates to 100ms for stability
        if (now - lastScrollUpdate.current < 100) return;

        setIsScrolled((prev) => {
            // High hysteresis: 
            // Shrink at 120px (committed scroll)
            // Expand at 5px (return to top)
            const next = prev ? scrollTop >= 5 : scrollTop > 120;
            if (next !== prev) {
                lastScrollUpdate.current = now;
                return next;
            }
            return prev;
        });
    }, []);


    // Synchronize selected table with Inertia prop updates
    useEffect(() => {
        if (selectedTable) {
            const updated = tables.find(t => t.id === selectedTable.id);
            if (updated) {
                setSelectedTable(updated);
            } else {
                setIsDrawerOpen(false);
                setSelectedTable(null);
            }
        }
    }, [tables]);

    const handleTableClick = (table) => {
        setSelectedTable(table);
        setIsDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setIsDrawerOpen(false);
        setSelectedTable(null);
    };

    // Time greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return (
    <>
        <MobileLayout activeTab="/waiter" onScroll={handleScroll}>
            {/* ─── Header ─── */}
            <div className={`sticky top-0 z-20 bg-background-dark/95 backdrop-blur-xl border-b border-border-subtle transition-shadow duration-500 ease-in-out pt-4 pb-4 ${isScrolled ? 'shadow-2xl' : ''}`}>
                <div className="px-5">
                    {/* Greeting Section - Stable transitions */}
                    <div 
                        className={`overflow-hidden transition-[max-height,opacity,margin,transform] duration-500 ease-in-out ${isScrolled ? 'max-h-0 opacity-0 mb-0 -translate-y-2' : 'max-h-40 opacity-100 mb-4 translate-y-0'}`}
                    >
                        <div className="flex items-center justify-between pb-1">
                            <div>
                                <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                                    {greeting}
                                </p>
                                <h1 className="text-white text-2xl font-black tracking-tight flex items-center gap-2">
                                    {userName.split(' ')[0]} <span className="text-primary">👋</span>
                                </h1>
                            </div>
                            <div className="size-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-primary/20 border border-white/10">
                                {userName?.charAt(0)?.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Stats Strip */}
                    <div className={`transition-all duration-500 ease-in-out ${isScrolled ? 'flex justify-between items-center bg-background-dark/80 border border-border-subtle rounded-full px-4 py-2 shadow-lg backdrop-blur-xl' : 'flex gap-2'}`}>
                        <div className={isScrolled ? 'flex items-center gap-2' : 'flex-1 bg-surface border border-border-subtle rounded-xl px-3 py-2.5 text-center'}>
                            <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Total</p>
                            <p className={`text-white font-black ${isScrolled ? 'text-sm' : 'text-xl'}`}>{stats.total || 0}</p>
                        </div>

                        {isScrolled && <div className="w-px h-4 bg-border-subtle/50" />}

                        <div className={isScrolled ? 'flex items-center gap-2' : 'flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-center'}>
                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className={isScrolled ? 'text-[10px] font-black' : ''}>LIVRES</span>
                            </p>
                            <p className={`text-white font-black ${isScrolled ? 'text-sm' : 'text-xl'}`}>{stats.free || 0}</p>
                        </div>

                        {isScrolled && <div className="w-px h-4 bg-border-subtle/50" />}

                        <div className={isScrolled ? 'flex items-center gap-2' : 'flex-1 bg-orange-500/5 border border-orange-500/20 rounded-xl px-3 py-2.5 text-center'}>
                            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                <span className={isScrolled ? 'text-[10px] font-black' : ''}>OCUPADAS</span>
                            </p>
                            <p className={`text-white font-black ${isScrolled ? 'text-sm' : 'text-xl'}`}>{stats.occupied || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Table Grid ─── */}
            <div className="px-4 pt-6 pb-8 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                    {tables.map((table) => {
                        const isOccupied = table.status === 'occupied';
                        const order = table.active_order;

                        return (
                            <button
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`
                                    relative flex flex-col items-center justify-center
                                    rounded-2xl p-5 min-h-[130px]
                                    transition-all duration-200 active:scale-[0.97]
                                    ${isOccupied
                                        ? 'bg-gradient-to-br from-orange-500/10 to-amber-600/5 border-2 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                                        : 'bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border-2 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                    }
                                `}
                            >
                                {/* Status Dot */}
                                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                                    isOccupied
                                        ? 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                                        : 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                }`} />

                                {/* Icon */}
                                <div className={`size-12 rounded-xl flex items-center justify-center mb-2 ${
                                    isOccupied
                                        ? 'bg-orange-500/15 text-orange-400'
                                        : 'bg-emerald-500/15 text-emerald-400'
                                }`}>
                                    <span className="material-symbols-outlined text-[28px]">table_restaurant</span>
                                </div>

                                {/* Table Name */}
                                <span className="text-white font-black text-base tracking-tight">
                                    {table.name}
                                </span>

                                {/* Meta Info */}
                                {isOccupied && order ? (
                                    <div className="flex flex-col items-center mt-1.5 gap-0.5">
                                        <span className="text-orange-300 text-xs font-bold">
                                            R$ {order.total.toFixed(2)}
                                        </span>
                                        <span className="text-text-muted text-[10px]">
                                            {order.elapsed_minutes}min • {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-emerald-400/70 text-xs font-semibold mt-1.5">
                                        Disponível
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </MobileLayout>

        {/* ─── Table Order Drawer (Fullscreen Mobile) ─── */}
        {/* Rendered OUTSIDE MobileLayout so it covers the bottom nav */}
        {isDrawerOpen && selectedTable && (
            <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#120F1D]">
                <TableOrderDrawer
                    table={selectedTable}
                    isOpen={true}
                    onClose={handleDrawerClose}
                    products={products}
                    pizzaFlavors={pizzaFlavors}
                    pizzaSizes={pizzaSizes}
                    categories={categories}
                    borderOptions={borderOptions}
                    isMobile={true}
                />
            </div>
        )}
    </>
    );
}
