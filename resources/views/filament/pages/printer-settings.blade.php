<x-filament-panels::page>
    <style>
        .prt-surface {
            background: #111113;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 1rem;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .prt-icon-box {
            padding: 0.625rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .prt-btn-test {
            display: flex; align-items: center; gap: 0.375rem;
            padding: 0.375rem 0.75rem; border-radius: 0.5rem;
            font-size: 0.75rem; font-weight: 700; cursor: pointer;
            transition: all 0.2s;
        }
    </style>

    <!-- Header info from Mockup -->
    <header class="mb-2">
        <h1 class="text-3xl font-bold text-white tracking-tight leading-tight">Painel de Impressoras</h1>
        <p class="text-slate-500 text-sm mt-1">Status e controle rápido do fluxo de impressão da pizzaria</p>
    </header>

    <!-- Printer Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-2">
        
        <!-- Kitchen Printer -->
        <div class="prt-surface" style="position: relative; overflow: hidden;">
            @if(isset($this->data['kitchen_enabled']) && $this->data['kitchen_enabled'])
                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #10b981;"></div>
            @else
                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #64748b;"></div>
            @endif
            
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="prt-icon-box" style="background: rgba(139, 92, 246, 0.1);">
                        <x-heroicon-o-fire class="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h3 class="font-bold text-white leading-none">Impressora Cozinha</h3>
                        <p class="text-slate-500 text-xs mt-1">Comandas e Pedidos</p>
                    </div>
                </div>
                
                @if(isset($this->data['kitchen_enabled']) && $this->data['kitchen_enabled'])
                    <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ATIVA
                    </span>
                @else
                    <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[11px] font-bold border border-slate-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        DESATIVADA
                    </span>
                @endif
            </div>

            <div class="space-y-3">
                <div class="flex items-center gap-3 text-slate-300">
                    <x-heroicon-o-wifi class="w-4 h-4 text-slate-500" />
                    <span class="text-xs font-medium">IP: <span class="text-white font-mono">{{ $this->data['kitchen_ip'] ?? 'Não configurado' }}</span></span>
                </div>
                <div class="flex items-center gap-3 text-slate-300">
                    <x-heroicon-o-arrows-right-left class="w-4 h-4 text-slate-500" />
                    <span class="text-xs font-medium">Porta: <span class="text-white font-mono">{{ $this->data['kitchen_port'] ?? '9100' }}</span></span>
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="text-xs text-slate-400 font-medium">
                    Papel: {{ isset($this->data['paper_width']) && $this->data['paper_width'] == '32' ? '58mm' : '80mm' }}
                </div>
                <button wire:click="testKitchenPrinter" class="prt-btn-test text-violet-500 border border-violet-500/40 hover:bg-violet-500/10" type="button">
                    <x-heroicon-o-printer class="w-4 h-4" />
                    Testar Conexão
                </button>
            </div>
        </div>

        <!-- Cashier Printer -->
        <div class="prt-surface" style="position: relative; overflow: hidden;">
            @if(isset($this->data['cashier_enabled']) && $this->data['cashier_enabled'])
                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #10b981;"></div>
            @else
                <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #64748b;"></div>
            @endif

            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <div class="prt-icon-box" style="background: rgba(59, 130, 246, 0.1);">
                        <x-heroicon-o-banknotes class="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 class="font-bold text-white leading-none">Impressora Caixa</h3>
                        <p class="text-slate-500 text-xs mt-1">Cupons e Recibos</p>
                    </div>
                </div>
                
                @if(isset($this->data['cashier_enabled']) && $this->data['cashier_enabled'])
                    <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ATIVA
                    </span>
                @else
                    <span class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[11px] font-bold border border-slate-500/20">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        DESATIVADA
                    </span>
                @endif
            </div>

            <div class="space-y-3">
                <div class="flex items-center gap-3 text-slate-300">
                    <x-heroicon-o-wifi class="w-4 h-4 text-slate-500" />
                    <span class="text-xs font-medium">IP: <span class="text-white font-mono">{{ $this->data['cashier_ip'] ?? 'Não configurado' }}</span></span>
                </div>
                <div class="flex items-center gap-3 text-slate-300">
                    <x-heroicon-o-arrows-right-left class="w-4 h-4 text-slate-500" />
                    <span class="text-xs font-medium">Porta: <span class="text-white font-mono">{{ $this->data['cashier_port'] ?? '9100' }}</span></span>
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="text-xs text-slate-400 font-medium">
                    Papel: {{ isset($this->data['paper_width']) && $this->data['paper_width'] == '32' ? '58mm' : '80mm' }}
                </div>
                <button wire:click="testCashierPrinter" class="prt-btn-test text-blue-500 border border-blue-500/40 hover:bg-blue-500/10" type="button">
                    <x-heroicon-o-printer class="w-4 h-4" />
                    Testar Conexão
                </button>
            </div>
        </div>
    </div>

    <div class="mt-4 flex items-center gap-2 mb-4">
        <x-heroicon-o-cog-6-tooth class="w-6 h-6 text-slate-400" />
        <h2 class="text-lg font-bold text-white">Editar Configurações de Rede e Papel</h2>
    </div>

    <form wire:submit="save">
        {{ $this->form }}

        <div class="mt-6 flex gap-4">
            <x-filament::button type="submit" size="lg" icon="heroicon-m-check">
                Salvar Configurações
            </x-filament::button>
        </div>
    </form>
</x-filament-panels::page>
