<x-filament-panels::page>
    <div class="font-sans dark" style="color-scheme: dark;">
        <style>
            .glass-panel {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .active-glow {
                box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
            }
            
            /* Custom Chart Styles */
            .chart-area-gradient {
                background: linear-gradient(180deg, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.0) 100%);
            }
        </style>

        <div class="bg-[#0A0A0B] text-slate-100 rounded-2xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8" style="min-height: calc(100vh - 4rem);">
            
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-inner">
                        <span class="material-symbols-outlined text-[24px]">analytics</span>
                    </div>
                    <div>
                        <h2 class="text-white text-2xl font-black tracking-tight font-sans">Relatórios Analíticos</h2>
                        <p class="text-slate-500 text-sm mt-1">Acompanhe métricas, faturamento e performance financeira.</p>
                    </div>
                </div>
                
                <div class="flex flex-wrap items-center gap-2">
                    <button wire:click="setToday" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all {{ $period === 'today' ? 'bg-primary text-white shadow-lg shadow-primary/30 active-glow' : 'bg-surface text-slate-400 hover:text-white hover:bg-white/5 border border-white/5' }}">
                        Hoje
                    </button>
                    <button wire:click="setThisWeek" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all {{ $period === 'week' ? 'bg-primary text-white shadow-lg shadow-primary/30 active-glow' : 'bg-surface text-slate-400 hover:text-white hover:bg-white/5 border border-white/5' }}">
                        Esta Semana
                    </button>
                    <button wire:click="setThisMonth" class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all {{ $period === 'month' ? 'bg-primary text-white shadow-lg shadow-primary/30 active-glow' : 'bg-surface text-slate-400 hover:text-white hover:bg-white/5 border border-white/5' }}">
                        Este Mês
                    </button>
                </div>
            </header>

            <div class="flex flex-col gap-8">
                <!-- KPI Section -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel rounded-2xl p-8 flex flex-col gap-2 relative overflow-hidden group border-t border-white/5">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                        <p class="text-slate-400 text-sm font-bold flex items-center gap-2 uppercase tracking-wider font-sans">
                            <span class="material-symbols-outlined text-[18px]">payments</span>
                            Receita Total
                        </p>
                        <div class="flex items-end gap-3 mt-1">
                            <h3 class="text-emerald-500 text-3xl font-black tracking-tight font-mono">R$ {{ number_format($totalSales, 2, ',', '.') }}</h3>
                        </div>
                        <p class="text-slate-500 text-xs mt-2">Período Selecionado</p>
                    </div>
                    
                    <div class="glass-panel rounded-2xl p-8 flex flex-col gap-2 relative overflow-hidden group border-t border-white/5">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                        <p class="text-slate-400 text-sm font-bold flex items-center gap-2 uppercase tracking-wider font-sans">
                            <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
                            Total de Pedidos
                        </p>
                        <div class="flex items-end gap-3 mt-1">
                            <h3 class="text-white text-3xl font-black tracking-tight font-mono">{{ number_format($totalOrders, 0, ',', '.') }}</h3>
                        </div>
                        <p class="text-slate-500 text-xs mt-2">Pedidos concluídos com sucesso</p>
                    </div>
                    
                    <div class="glass-panel rounded-2xl p-8 flex flex-col gap-2 relative overflow-hidden group border-t border-white/5">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                        <p class="text-slate-400 text-sm font-bold flex items-center gap-2 uppercase tracking-wider font-sans">
                            <span class="material-symbols-outlined text-[18px]">receipt_long</span>
                            Ticket Médio
                        </p>
                        <div class="flex items-end gap-3 mt-1">
                            <h3 class="text-primary text-3xl font-black tracking-tight font-mono">R$ {{ number_format($averageTicket, 2, ',', '.') }}</h3>
                        </div>
                        <p class="text-slate-500 text-xs mt-2">Valor médio por transação</p>
                    </div>
                </div>

                <!-- Main Chart Panel -->
                <div class="glass-panel rounded-2xl p-8 border-t border-white/5">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <h3 class="text-white text-lg font-bold font-sans">Receita Diária</h3>
                            <p class="text-slate-500 text-sm">Visualização do faturamento no período selecionado</p>
                        </div>
                    </div>
                    <div class="h-[350px] w-full relative">
                        @if(empty($salesByDay))
                            <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <span class="material-symbols-outlined text-4xl mb-3 opacity-50">show_chart</span>
                                <p class="text-sm font-medium">Não há dados suficientes para exibir o gráfico.</p>
                            </div>
                        @else
                            <!-- Simple CSS Bar Chart for Sales By Day instead of complex SVG path generation -->
                            @php
                                $maxTotal = 1;
                                foreach($salesByDay as $day) {
                                    if(isset($day['total']) && $day['total'] > $maxTotal) {
                                        $maxTotal = $day['total'];
                                    }
                                }
                            @endphp
                            
                            <div class="absolute inset-0 flex flex-col justify-between pt-4 pb-8">
                                <div class="border-t border-white/5 w-full flex items-center h-px relative">
                                    <span class="absolute -left-2 md:-left-12 text-[10px] text-slate-500 font-bold font-mono">Max</span>
                                </div>
                                <div class="border-t border-white/5 w-full flex items-center h-px relative"></div>
                                <div class="border-t border-white/5 w-full flex items-center h-px relative"></div>
                                <div class="border-t border-white/5 w-full flex items-center h-px relative">
                                    <span class="absolute -left-2 md:-left-12 text-[10px] text-slate-500 font-bold font-mono">R$ 0</span>
                                </div>
                            </div>
                            
                            <!-- Bars -->
                            <div class="absolute inset-0 pb-8 pt-4 flex items-end justify-between px-2 md:px-8 gap-1 md:gap-4">
                                @foreach($salesByDay as $day)
                                    @php
                                        $percentage = ($day['total'] / $maxTotal) * 100;
                                        $percentage = max(2, $percentage); // minimum height
                                    @endphp
                                    <div class="relative w-full flex flex-col items-center group flex-1">
                                        <!-- Tooltip -->
                                        <div class="absolute bottom-full mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 font-bold whitespace-nowrap shadow-xl pointer-events-none">
                                            R$ {{ number_format($day['total'], 2, ',', '.') }}<br>
                                            <span class="text-slate-400 font-normal">{{ $day['orders'] }} pedidos</span>
                                        </div>
                                        
                                        <!-- Bar -->
                                        <div class="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary/20 to-primary/80 group-hover:from-primary/40 group-hover:to-primary transition-all relative overflow-hidden" style="height: {{ $percentage }}%;">
                                            <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        
                                        <!-- Label -->
                                        <span class="absolute -bottom-6 text-[10px] text-slate-500 font-bold uppercase tracking-wide truncate w-[150%] text-center">{{ $day['date'] }}</span>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </div>
                </div>

                <!-- Bottom Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Ranking Pizzas -->
                    <div class="glass-panel rounded-2xl p-8 border-t border-white/5">
                        <h3 class="text-white text-lg font-bold mb-6 font-sans">Top 5 Pizzas Mais Vendidas</h3>
                        
                        @if(empty($topPizzas))
                            <div class="flex flex-col items-center justify-center p-8 text-slate-500 h-full">
                                <span class="material-symbols-outlined text-4xl mb-3 opacity-50">local_pizza</span>
                                <p class="text-sm font-medium">Nenhum dado disponível.</p>
                            </div>
                        @else
                            <div class="flex flex-col gap-6">
                                @php
                                    $maxPizzas = max(1, $topPizzas[0]['qty'] ?? 1);
                                @endphp
                                @foreach(array_slice($topPizzas, 0, 5) as $index => $pizza)
                                    @php
                                        $percentage = min(100, ($pizza['qty'] / $maxPizzas) * 100);
                                        $colors = ['bg-primary', 'bg-primary/80', 'bg-primary/60', 'bg-primary/40', 'bg-primary/30'];
                                        $numColors = ['bg-primary/20 text-primary', 'bg-white/5 text-slate-400', 'bg-white/5 text-slate-400', 'bg-white/5 text-slate-400', 'bg-white/5 text-slate-400'];
                                    @endphp
                                    <div class="flex items-center gap-4">
                                        <div class="w-8 h-8 rounded-lg {{ $numColors[$index] ?? 'bg-white/5 text-slate-400' }} flex items-center justify-center font-black text-sm font-mono shadow-inner">
                                            {{ $index + 1 }}
                                        </div>
                                        <div class="flex-[1_1_0%] min-w-0">
                                            <div class="flex justify-between mb-2">
                                                <span class="text-slate-100 text-sm font-bold truncate font-sans pr-2">{{ collect(explode(',', $pizza['name']))->map(fn($n) => trim($n))->implode(' + ') }}</span>
                                                <span class="text-slate-400 text-xs font-bold whitespace-nowrap">{{ $pizza['qty'] }} vendas</span>
                                            </div>
                                            <div class="w-full h-2.5 bg-white/5 border border-white/5 rounded-full overflow-hidden shadow-inner">
                                                <div class="h-full {{ $colors[$index] ?? 'bg-primary/30' }} rounded-full" style="width: {{ max(5, $percentage) }}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </div>

                    <!-- Payment Distribution -->
                    <div class="glass-panel rounded-2xl p-8 flex flex-col border-t border-white/5">
                        <h3 class="text-white text-lg font-bold mb-8 font-sans">Formas de Pagamento</h3>
                        
                        @if(empty($paymentBreakdown))
                            <div class="flex flex-col items-center justify-center p-8 text-slate-500 h-full">
                                <span class="material-symbols-outlined text-4xl mb-3 opacity-50">payments</span>
                                <p class="text-sm font-medium">Nenhum pagamento registrado.</p>
                            </div>
                        @else
                            <div class="flex-1 flex flex-col justify-center">
                                @php
                                    $totalPayments = collect($paymentBreakdown)->sum('count') ?: 1;
                                    $paymentColors = [
                                        'pix' => 'bg-emerald-500 text-emerald-500', 
                                        'credito' => 'bg-primary text-primary', 
                                        'debito' => 'bg-blue-500 text-blue-500', 
                                        'dinheiro' => 'bg-amber-500 text-amber-500',
                                        'default' => 'bg-slate-500 text-slate-500'
                                    ];
                                @endphp

                                <!-- Progress Bars instead of SVG Donut for easier responsive dynamic rendering -->
                                <div class="flex flex-col gap-6 w-full">
                                    @foreach($paymentBreakdown as $payment)
                                        @php
                                            $methodKey = strtolower($payment['method'] ?? 'default');
                                            $colorClass = $paymentColors[$methodKey] ?? $paymentColors['default'];
                                            $percentage = ($payment['count'] / $totalPayments) * 100;
                                        @endphp
                                        <div class="flex items-center gap-4 group">
                                            <div class="flex-1">
                                                <div class="flex justify-between mb-2">
                                                    <div class="flex items-center gap-2">
                                                        <div class="w-3 h-3 rounded-full {{ explode(' ', $colorClass)[0] }} shadow-sm"></div>
                                                        <span class="text-white text-sm font-bold">{{ $payment['label'] }}</span>
                                                    </div>
                                                    <div class="text-right">
                                                        <span class="text-slate-300 text-sm font-bold font-mono">R$ {{ number_format($payment['total'], 2, ',', '.') }}</span>
                                                        <span class="text-slate-500 text-xs font-bold block">{{ number_format($percentage, 1) }}% ({{ $payment['count'] }})</span>
                                                    </div>
                                                </div>
                                                <div class="w-full h-2.5 bg-white/5 border border-white/5 rounded-full overflow-hidden shadow-inner">
                                                    <div class="h-full {{ explode(' ', $colorClass)[0] }} rounded-full" style="width: {{ max(2, $percentage) }}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                        
                        <div class="mt-8 pt-6 border-t border-white/5">
                            <p class="text-slate-400 text-xs text-center italic">
                                "O ticket médio geral do período é de <span class="text-primary font-bold">R$ {{ number_format($averageTicket, 2, ',', '.') }}</span>."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>
