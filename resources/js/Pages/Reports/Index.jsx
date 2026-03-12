import AppLayout from '@/Layouts/AppLayout';

function GlassPanel({ children, className = '' }) {
    return (
        <div className={`rounded-2xl p-8 ${className}`} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {children}
        </div>
    );
}

export default function Index({ stats = {}, topProducts = [], typeDistribution = [] }) {
    const formatBRL = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
    const maxSales = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.sales)) : 1;
    const totalDistribution = typeDistribution.reduce((sum, t) => sum + t.count, 0);

    const typeLabels = { delivery: 'Delivery', pickup: 'Retirada', salon: 'Salão', dine_in: 'Salão' };
    const typeColors = { delivery: 'bg-primary', pickup: 'bg-slate-600', salon: 'bg-emerald-500', dine_in: 'bg-emerald-500' };

    return (
        <AppLayout>
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-md z-10 border-b border-border-subtle">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <div>
                            <h2 className="text-white text-xl font-bold tracking-tight">Relatórios Analíticos</h2>
                            <p className="text-text-muted text-xs">Dados consolidados do estabelecimento</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-all">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Exportar Dados
                    </button>
                </header>

                <div className="p-10 flex flex-col gap-8">
                    {/* KPI Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassPanel className="relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 size-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                            <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Receita Total</p>
                            <div className="flex items-end gap-3 mt-2">
                                <h3 className="text-emerald-400 text-3xl font-bold tracking-tight">{formatBRL(stats.total_revenue ?? 0)}</h3>
                            </div>
                            <p className="text-text-muted text-xs mt-2">Pedidos pagos acumulados</p>
                        </GlassPanel>
                        <GlassPanel>
                            <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Total de Pedidos</p>
                            <div className="flex items-end gap-3 mt-2">
                                <h3 className="text-white text-3xl font-bold tracking-tight">{stats.total_orders ?? 0}</h3>
                            </div>
                            <p className="text-text-muted text-xs mt-2">Pedidos concluídos com sucesso</p>
                        </GlassPanel>
                        <GlassPanel className="relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                            <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Ticket Médio</p>
                            <div className="flex items-end gap-3 mt-2">
                                <h3 className="text-primary text-3xl font-bold tracking-tight">{formatBRL(stats.avg_ticket ?? 0)}</h3>
                            </div>
                            <p className="text-text-muted text-xs mt-2">Valor médio por transação</p>
                        </GlassPanel>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <GlassPanel>
                            <h3 className="text-white text-lg font-bold mb-6">Top Produtos Mais Vendidos</h3>
                            <div className="flex flex-col gap-6">
                                {topProducts.length === 0 ? (
                                    <p className="text-text-muted text-sm text-center py-8">Nenhum dado disponível</p>
                                ) : (
                                    topProducts.map((product, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className={`size-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-slate-100 text-sm font-semibold">{product.name}</span>
                                                    <span className="text-text-muted text-xs font-bold">{product.sales} vendas</span>
                                                </div>
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${(product.sales / maxSales) * 100}%`, opacity: 1 - (idx * 0.15) }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassPanel>

                        {/* Order Type Distribution */}
                        <GlassPanel className="flex flex-col">
                            <h3 className="text-white text-lg font-bold mb-8">Tipo de Pedido</h3>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="flex flex-col gap-6 w-full">
                                    {typeDistribution.length === 0 ? (
                                        <p className="text-text-muted text-sm text-center py-8">Nenhum dado disponível</p>
                                    ) : (
                                        typeDistribution.map((type, idx) => {
                                            const pct = totalDistribution > 0 ? ((type.count / totalDistribution) * 100).toFixed(0) : 0;
                                            const color = typeColors[type.type] || 'bg-slate-600';
                                            return (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className={`size-3 rounded-full ${color}`}></div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-white text-sm font-bold">{typeLabels[type.type] || type.type}</span>
                                                            <span className="text-text-muted text-xs">{pct}% ({type.count})</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div className="text-center mt-4 pt-4 border-t border-border-subtle">
                                        <span className="text-3xl font-bold text-white">{totalDistribution}</span>
                                        <p className="text-text-muted text-xs font-bold uppercase mt-1">Total de Pedidos</p>
                                    </div>
                                </div>
                            </div>
                        </GlassPanel>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
