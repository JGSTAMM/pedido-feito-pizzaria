<x-filament::page>
    <style>
        .cr-surface {
            background: white;
            border: 1px solid #e4e4e7;
            border-radius: 1rem;
            padding: 1.5rem;
        }
        .dark .cr-surface {
            background: #18181b;
            border-color: rgba(255,255,255,0.05);
        }
        .cr-metric {
            display: flex; flex-direction: column; justify-content: space-between; height: 100%;
        }
        .cr-metric-title {
            color: #71717a; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .cr-metric-value {
            font-size: 1.5rem; font-weight: 700; color: #18181b; margin-top: 0.5rem;
        }
        .dark .cr-metric-value {
            color: white;
        }
        .cr-btn-primary {
            width: 100%; padding: 1rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 0.75rem; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.1s;
        }
        .cr-btn-danger {
            width: 100%; padding: 1rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 0.75rem; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.1s;
        }
        .cr-text-heading {
            color: #18181b;
        }
        .dark .cr-text-heading {
            color: white;
        }
        .cr-text-secondary {
            color: #71717a;
        }
        .dark .cr-text-secondary {
            color: #9ca3af;
        }
        .cr-closed-box {
            background: white;
            border: 1px solid #e4e4e7;
        }
        .dark .cr-closed-box {
            background: #18181b;
            border-color: rgba(255,255,255,0.05);
        }
    </style>

    @if(!$activeRegister)
        <div style="display: flex; align-items: center; justify-content: center; height: calc(100vh - 12rem);">
            <div class="cr-surface" style="max-width: 480px; width: 100%; text-align: center; border-radius: 1rem; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">💰</div>
                <h2 class="cr-text-heading" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Caixa Fechado</h2>
                <p class="cr-text-secondary" style="margin-bottom: 2rem; font-size: 0.875rem;">Para iniciar as operações, abra o caixa informando o saldo inicial (fundo de troco).</p>
                
                <form wire:submit="openRegister" style="text-align: left;">
                    {{ $this->form }}
                    <div class="mt-6">
                        <button type="submit" class="cr-btn-primary">
                            🔓 Abrir Caixa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @else
        <div class="space-y-6">
            <!-- Header Section -->
            <header class="pb-2 space-y-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-3xl font-bold tracking-tight cr-text-heading">Gestão de Caixa</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="flex h-2 w-2 rounded-full bg-emerald-500" style="box-shadow: 0 0 8px rgba(16,185,129,0.5);"></span>
                            <p class="text-emerald-500 text-sm font-semibold uppercase tracking-wider">Caixa Aberto</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase font-medium tracking-widest cr-text-secondary">Operador</p>
                        <p class="font-semibold cr-text-heading">{{ auth()->user()->name ?? 'Administrador' }}</p>
                    </div>
                </div>
            </header>

            <!-- Metrics Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="cr-surface cr-metric">
                    <p class="cr-metric-title">Saldo Inicial</p>
                    <div>
                        <p class="cr-metric-value" style="color: #71717a;">R$ {{ number_format($summary['opening_balance'] ?? 0, 2, ',', '.') }}</p>
                        <p class="text-xs font-medium mt-1 cr-text-secondary">Fundo de troco</p>
                    </div>
                </div>
                <div class="cr-surface cr-metric" style="border-color: rgba(16,185,129,0.2);">
                    <p class="cr-metric-title" style="color: #10b981;">Vendas Dinheiro</p>
                    <div>
                        <p class="cr-metric-value" style="color: #10b981;">R$ {{ number_format(($summary['methods']['dinheiro'] ?? 0), 2, ',', '.') }}</p>
                        <p style="color: rgba(16,185,129,0.6);" class="text-[10px] font-medium mt-1">Entradas em espécie</p>
                    </div>
                </div>
                <div class="cr-surface cr-metric" style="border-color: rgba(239,68,68,0.2);">
                    <p class="cr-metric-title" style="color: #ef4444;">Trocos Entregues</p>
                    <div>
                        <p class="cr-metric-value" style="color: #ef4444;">R$ {{ number_format($summary['total_change'] ?? 0, 2, ',', '.') }}</p>
                        <p style="color: rgba(239,68,68,0.6);" class="text-[10px] font-medium mt-1">Saídas de caixa</p>
                    </div>
                </div>
                <div class="cr-surface cr-metric" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05)); border: 1px solid rgba(16,185,129,0.3);">
                    <p class="cr-metric-title" style="color: #10b981;">Total em Gaveta</p>
                    <div>
                        <p class="cr-metric-value text-3xl" style="color: #10b981;">R$ {{ number_format($summary['total_in_drawer'] ?? 0, 2, ',', '.') }}</p>
                        <p style="color: rgba(16,185,129,0.8);" class="text-[10px] font-medium mt-1">Valor esperado físico</p>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                <!-- Payment Methods Summary -->
                <div class="lg:col-span-2 space-y-4">
                    <div class="cr-surface">
                        <h2 class="font-bold text-lg mb-4 cr-text-heading">Vendas Totais: R$ {{ number_format($summary['total_sales'] ?? 0, 2, ',', '.') }}</h2>
                        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 cr-text-secondary">Resumo por Pagamento</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                            @if(isset($summary['methods']))
                                @php
                                    $icons = [
                                        'dinheiro' => ['icon' => 'currency-dollar', 'color' => 'text-emerald-500'],
                                        'pix' => ['icon' => 'qr-code', 'color' => 'text-orange-500'],
                                        'credito' => ['icon' => 'credit-card', 'color' => 'text-blue-400'],
                                        'debito' => ['icon' => 'credit-card', 'color' => 'text-indigo-400'],
                                    ];
                                @endphp
                                @foreach($summary['methods'] as $method => $amount)
                                    @php $cfg = $icons[strtolower($method)] ?? ['icon' => 'currency-dollar', 'color' => 'text-gray-400']; @endphp
                                    <div class="bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 p-4 rounded-xl">
                                        <div class="flex items-center gap-2 mb-2">
                                            @php $iconName = 'heroicon-o-' . $cfg['icon']; @endphp
                                            <x-dynamic-component :component="$iconName" class="w-5 h-5 {{ $cfg['color'] }}" />
                                            <p class="text-[10px] uppercase font-bold cr-text-secondary">{{ $method }}</p>
                                        </div>
                                        <p class="font-bold font-mono cr-text-heading">R$ {{ number_format($amount, 2, ',', '.') }}</p>
                                    </div>
                                @endforeach
                            @endif
                        </div>
                    </div>
                </div>

                <!-- Closing Form -->
                <div class="cr-surface">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2 cr-text-heading">
                        <x-heroicon-o-lock-closed class="w-5 h-5 text-red-500"/>
                        Fechar Caixa
                    </h2>
                    
                    <form wire:submit="closeRegister">
                        {{ $this->form }}
                        
                        <div class="mt-6 flex justify-end">
                            <button type="submit" class="cr-btn-danger">
                                🔒 Confirmar Fechamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    @endif
</x-filament::page>
