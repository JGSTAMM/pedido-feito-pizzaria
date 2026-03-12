<x-filament-panels::page>
    <style>
        [x-cloak] { display: none !important; }
        .kds-dark-wrapper { color-scheme: dark; }
        .kds-container { font-family: "Work Sans", sans-serif; background-color: #0A0A0B; color: #E4E4E7; display: flex; flex-direction: column; height: calc(100vh - 8rem); margin: -2rem; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    </style>

    <div class="kds-dark-wrapper dark" x-data="{ selectedOrder: null, openModal(id) { this.selectedOrder = id; }, closeModal() { this.selectedOrder = null; } }">

    <div class="kds-container relative overflow-hidden bg-background-dark font-sans" wire:poll.10s>
        <!-- Header -->
        <header class="flex-shrink-0 px-8 py-6 border-b border-border-subtle bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 w-full">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto w-full">
                <div>
                    <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                        <span>🍳</span> Cozinha (KDS)
                    </h2>
                    <p class="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Atualização automática a cada 10s
                    </p>
                </div>
                
                @php
                    $orders = $this->getOrders();
                    $pendingOrders = $orders->where('status', 'pending');
                    $preparingOrders = $orders->where('status', 'preparing');
                    $readyOrders = $orders->where('status', 'ready');
                @endphp

                <!-- Status Counters -->
                <div class="flex items-center gap-4">
                    <div class="flex flex-col items-center justify-center bg-surface border border-border-subtle rounded-xl px-5 py-2 min-w-[100px]">
                        <span class="text-amber-500 text-xs font-bold uppercase tracking-wider mb-0.5">Pendentes</span>
                        <span class="text-white text-2xl font-bold font-mono stat-pending">{{ $pendingOrders->count() }}</span>
                    </div>
                    <div class="flex flex-col items-center justify-center bg-surface border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] rounded-xl px-5 py-2 min-w-[100px]">
                        <span class="text-primary text-xs font-bold uppercase tracking-wider mb-0.5">Preparando</span>
                        <span class="text-white text-2xl font-bold font-mono">{{ $preparingOrders->count() }}</span>
                    </div>
                    <div class="flex flex-col items-center justify-center bg-surface border border-border-subtle rounded-xl px-5 py-2 min-w-[100px]">
                        <span class="text-emerald-soft text-xs font-bold uppercase tracking-wider mb-0.5">Prontos</span>
                        <span class="text-white text-2xl font-bold font-mono">{{ $readyOrders->count() }}</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- KDS Board -->
        <div class="flex-1 overflow-x-auto overflow-y-hidden p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-w-[1000px] max-w-[1400px] mx-auto">
                
                <!-- Coluna: Pendentes -->
                <div class="flex flex-col h-full bg-surface/50 rounded-2xl border border-border-subtle overflow-hidden">
                    <div class="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center bg-[#18181B]/50">
                        <h3 class="font-semibold text-slate-200">Pendentes</h3>
                        <span class="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold">{{ $pendingOrders->count() }}</span>
                    </div>
                    <div class="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                        @forelse($pendingOrders as $order)
                            <!-- Card Pendente -->
                            <div class="relative bg-[#131316] border border-border-subtle rounded-xl p-4 border-l-4 border-l-amber-500 shadow-lg group hover:border-white/20 transition-all">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="text-lg font-bold text-white">#{{ $order->id }}</h4>
                                        <p class="text-sm text-slate-400">
                                            @if($order->type === 'delivery') 🛵 {{ $order->customer_name ?? 'Delivery' }} @elseif($order->table) 🪑 {{ $order->table->name }} @else 👤 {{ $order->customer_name ?? 'Balcão' }} @endif
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button @click="openModal({{ $order->id }})" class="p-1 rounded bg-[#111113] text-gray-400 hover:text-white" title="Info"><span class="material-symbols-outlined text-[16px]">info</span></button>
                                        <span class="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Aguardando</span>
                                    </div>
                                </div>
                                <div class="space-y-2 mb-4">
                                    @foreach($order->kitchenItems as $item)
                                        <div class="flex items-start gap-2 text-sm text-slate-300">
                                            <span class="font-bold text-white bg-white/10 px-1.5 rounded">{{ $item->quantity }}x</span>
                                            <div class="flex-1">
                                                <span>{{ $item->product ? $item->product->name : ($item->pizzaSize ? 'Pizza ' . $item->pizzaSize->name : 'Item') }}</span>
                                                @if($item->pizzaSize && $item->flavors->count() > 0)
                                                    <div class="text-xs text-slate-400 mt-1 pl-2">{{ $item->flavors->pluck('name')->join(', ') }}</div>
                                                @endif
                                                @if($item->notes)
                                                    <div class="text-[10px] text-amber-500 italic pl-2 mt-1">• {{ $item->notes }}</div>
                                                @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                                <div class="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                                    <div class="flex items-center gap-1.5 text-amber-500 font-mono text-sm">
                                        <span class="material-symbols-outlined text-[16px]">timer</span>
                                        <span class="order-timer" data-timestamp="{{ $order->created_at->timestamp }}">--:--</span>
                                    </div>
                                    <button wire:click="startPreparing({{ $order->id }})" class="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary/20">
                                        INICIAR
                                    </button>
                                </div>
                            </div>
                        @empty
                            <div class="text-center text-text-muted opacity-50 py-8 flex flex-col items-center">
                                <span class="material-symbols-outlined text-4xl mb-2">inbox</span>
                                <span>Nenhum pedido pendente</span>
                            </div>
                        @endforelse
                    </div>
                </div>

                <!-- Coluna: Preparando -->
                <div class="flex flex-col h-full bg-surface/50 rounded-2xl border border-border-subtle overflow-hidden relative">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    <div class="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center bg-[#18181B]/50">
                        <h3 class="font-semibold text-slate-200">Em Preparo</h3>
                        <span class="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">{{ $preparingOrders->count() }}</span>
                    </div>
                    <div class="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                        @forelse($preparingOrders as $order)
                            <!-- Card Preparando -->
                            <div class="relative bg-[#131316] border border-primary/20 rounded-xl p-4 border-l-4 border-l-primary shadow-[0_0_20px_rgba(139,92,246,0.05)] group">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="text-lg font-bold text-white">#{{ $order->id }}</h4>
                                        <p class="text-sm text-slate-400">
                                            @if($order->type === 'delivery') 🛵 {{ $order->customer_name ?? 'Delivery' }} @elseif($order->table) 🪑 {{ $order->table->name }} @else 👤 {{ $order->customer_name ?? 'Balcão' }} @endif
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button @click="openModal({{ $order->id }})" class="p-1 rounded bg-[#111113] text-gray-400 hover:text-white" title="Info"><span class="material-symbols-outlined text-[16px]">info</span></button>
                                        <span class="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide animate-pulse">Preparando</span>
                                    </div>
                                </div>
                                <div class="space-y-2 mb-4">
                                    @foreach($order->kitchenItems as $item)
                                        <div class="flex items-start gap-2 text-sm text-slate-300">
                                            <span class="font-bold text-white bg-white/10 px-1.5 rounded">{{ $item->quantity }}x</span>
                                            <div class="flex-1">
                                                <span>{{ $item->product ? $item->product->name : ($item->pizzaSize ? 'Pizza ' . $item->pizzaSize->name : 'Item') }}</span>
                                                @if($item->pizzaSize && $item->flavors->count() > 0)
                                                    <div class="text-xs text-slate-400 mt-1 pl-2">{{ $item->flavors->pluck('name')->join(', ') }}</div>
                                                @endif
                                                @if($item->notes)
                                                    <div class="text-[10px] text-amber-500 italic pl-2 mt-1">• {{ $item->notes }}</div>
                                                @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                                <div class="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                                    <div class="flex items-center gap-1.5 text-primary font-mono text-sm font-bold">
                                        <span class="material-symbols-outlined text-[16px]">timelapse</span>
                                        <span class="order-timer" data-timestamp="{{ $order->created_at->timestamp }}">--:--</span>
                                    </div>
                                    <button wire:click="markReady({{ $order->id }})" class="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-soft border border-emerald-600/30 text-xs font-bold px-4 py-2 rounded-lg transition-all">
                                        PRONTO
                                    </button>
                                </div>
                            </div>
                        @empty
                            <div class="text-center text-text-muted opacity-50 py-8 flex flex-col items-center">
                                <span class="material-symbols-outlined text-4xl mb-2">skillet</span>
                                <span>Nada em preparo</span>
                            </div>
                        @endforelse
                    </div>
                </div>

                <!-- Coluna: Prontos -->
                <div class="flex flex-col h-full bg-surface/50 rounded-2xl border border-border-subtle overflow-hidden">
                    <div class="px-4 py-3 border-b border-border-subtle bg-surface flex justify-between items-center bg-[#18181B]/50">
                        <h3 class="font-semibold text-slate-200">Prontos para Servir</h3>
                        <span class="bg-emerald-soft/20 text-emerald-soft text-xs px-2 py-0.5 rounded-full font-bold">{{ $readyOrders->count() }}</span>
                    </div>
                    <div class="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide opacity-80 hover:opacity-100 transition-opacity">
                        @forelse($readyOrders as $order)
                            <!-- Card Pronto -->
                            <div class="relative bg-[#131316] border border-border-subtle rounded-xl p-4 border-l-4 border-l-emerald-soft group">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="text-lg font-bold text-white decoration-emerald-soft/50">#{{ $order->id }}</h4>
                                        <p class="text-sm text-slate-400">
                                            @if($order->type === 'delivery') 🛵 {{ $order->customer_name ?? 'Delivery' }} @elseif($order->table) 🪑 {{ $order->table->name }} @else 👤 {{ $order->customer_name ?? 'Balcão' }} @endif
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button @click="openModal({{ $order->id }})" class="p-1 rounded bg-[#111113] text-gray-400 hover:text-white" title="Info"><span class="material-symbols-outlined text-[16px]">info</span></button>
                                        <span class="bg-emerald-soft/10 text-emerald-soft border border-emerald-soft/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide flex-shrink-0">Pronto</span>
                                    </div>
                                </div>
                                <div class="space-y-2 mb-4">
                                    @foreach($order->kitchenItems as $item)
                                        <div class="flex items-start gap-2 text-sm text-slate-400">
                                            <span class="font-bold text-slate-300 bg-white/5 px-1.5 rounded">{{ $item->quantity }}x</span>
                                            <span class="line-through decoration-slate-600">{{ $item->product ? $item->product->name : ($item->pizzaSize ? 'Pizza ' . $item->pizzaSize->name : 'Item') }}</span>
                                        </div>
                                    @endforeach
                                </div>
                                <div class="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                                    <div class="flex items-center gap-1.5 text-slate-500 font-mono text-sm">
                                        <span class="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>Concluído</span>
                                    </div>
                                    <button wire:click="markDelivered({{ $order->id }})" class="text-slate-500 hover:text-white text-xs font-bold px-2 py-1 transition-colors">
                                        ENTREGUE
                                    </button>
                                </div>
                            </div>
                        @empty
                            <div class="text-center text-text-muted opacity-50 py-8 flex flex-col items-center">
                                <span class="material-symbols-outlined text-4xl mb-2">check_circle</span>
                                <span>Nenhum pedido pronto</span>
                            </div>
                        @endforelse
                    </div>
                </div>

            </div>
        </div>

    </div>

    {{-- MODALS - Rendered OUTSIDE the grid/poll area  --}}
    @if(isset($orders) && $orders->count() > 0)
        @foreach($orders as $order)
            <div x-show="selectedOrder === {{ $order->id }}" x-cloak style="position: fixed; inset: 0; z-index: 99999;" role="dialog" aria-modal="true">
                {{-- Backdrop --}}
                <div @click="closeModal()" class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

                {{-- Centering wrapper --}}
                <div class="relative w-full h-full flex items-center justify-center p-4">
                    {{-- Modal Panel --}}
                    <div @click.stop class="relative bg-[#111113] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-border-subtle overflow-hidden">
                        {{-- Header --}}
                        <div class="p-5 border-b border-border-subtle flex justify-between items-center bg-[#0A0A0B]">
                            <div>
                                <h2 class="text-2xl font-bold text-white mb-1">Pedido #{{ $order->id }}</h2>
                                <p class="text-text-muted text-sm">
                                    @if($order->type === 'delivery') 🛵 {{ $order->customer_name ?? 'Delivery' }} @elseif($order->table) 🪑 {{ $order->table->name }} @else 👤 {{ $order->customer_name ?? 'Balcão' }} @endif
                                    • {{ $order->created_at->format('H:i') }}
                                </p>
                            </div>
                            <button @click="closeModal()" class="text-text-muted hover:text-white bg-surface hover:bg-surface-hover rounded-lg p-2 transition-colors">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        {{-- Body --}}
                        <div class="p-6 overflow-y-auto flex-1 text-slate-200 bg-background-dark">
                            {{-- Kitchen Section --}}
                            <div class="mb-6">
                                <div class="flex items-center gap-2 mb-4 border-b border-border-subtle pb-2">
                                    <span class="text-2xl">🔥</span>
                                    <h3 class="text-lg font-semibold text-amber-500 m-0">Cozinha</h3>
                                </div>
                                <div class="space-y-4">
                                    @foreach($order->kitchenItems as $item)
                                        <div class="flex gap-4 p-3 border border-border-subtle bg-surface rounded-xl hover:border-border-subtle transition-colors">
                                            <span class="text-xl font-bold text-emerald-soft min-w-[2rem]">{{ $item->quantity }}x</span>
                                            <div class="flex-1">
                                                <div class="text-lg font-medium text-white mb-1">
                                                    @if($item->pizzaSize) 🍕 Pizza {{ $item->pizzaSize->name }} @elseif($item->product) {{ $item->product->name }} @else Item @endif
                                                </div>
                                                @if($item->pizzaSize && $item->flavors->count() > 0)
                                                    <div class="text-text-muted text-sm">{{ $item->flavors->pluck('name')->join(', ') }}</div>
                                                @endif
                                                @if($item->notes)
                                                    <div class="mt-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg border-l-2 border-amber-500 text-sm font-medium">
                                                        📝 {{ $item->notes }}
                                                    </div>
                                                @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                            
                            @php
                                $barItems = $order->items->filter(function($item) use ($order) { return !$order->kitchenItems->contains('id', $item->id); });
                            @endphp
                            
                            @if($barItems->count() > 0)
                                {{-- Bar Section --}}
                                <div>
                                    <div class="flex items-center gap-2 mb-4 border-b border-border-subtle pb-2">
                                        <span class="text-2xl">🍹</span>
                                        <h3 class="text-lg font-semibold text-blue-400 m-0">Bar / Bebidas</h3>
                                    </div>
                                    <div class="space-y-3">
                                        @foreach($barItems as $item)
                                            <div class="flex gap-4 p-2 border-b border-border-subtle last:border-0">
                                                <span class="text-lg font-bold text-blue-500 min-w-[2rem]">{{ $item->quantity }}x</span>
                                                <div class="flex-1">
                                                    <div class="text-base text-white">{{ $item->product ? $item->product->name : 'Item' }}</div>
                                                    @if($item->notes)
                                                        <div class="text-xs text-amber-500 mt-1 italic">📝 {{ $item->notes }}</div>
                                                    @endif
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endif
                        </div>

                        {{-- Footer --}}
                        <div class="p-4 border-t border-border-subtle bg-[#0A0A0B] flex justify-end gap-3">
                            <button wire:click="reprintOrder({{ $order->id }})" class="px-4 py-2 bg-surface hover:bg-surface-hover border border-border-subtle text-white rounded-xl transition-colors font-medium text-sm flex items-center gap-2">
                                <span class="material-symbols-outlined text-[18px]">print</span>
                            </button>
                            <button @click="closeModal()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-bold text-sm">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        @endforeach
    @endif
    </div>

    <script>
        function updateTimers() {
            document.querySelectorAll('.order-timer').forEach(timer => {
                const timestamp = parseInt(timer.dataset.timestamp);
                const now = Math.floor(Date.now() / 1000);
                const diff = now - timestamp;
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                timer.classList.remove('text-emerald-soft', 'text-amber-500', 'text-red-500');
                if (minutes >= 15) timer.classList.add('text-red-500');
                else if (minutes >= 8) timer.classList.add('text-amber-500');
                else timer.classList.add('text-emerald-soft');
            });
        }
        setInterval(updateTimers, 1000); updateTimers();

        let lastOrderCount = null;
        document.addEventListener('livewire:navigated', () => {
            const pendingBadge = document.querySelector('.stat-pending');
            if (pendingBadge) {
                const newCount = parseInt(pendingBadge.textContent);
                if (lastOrderCount !== null && newCount > lastOrderCount) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator(); const gain = ctx.createGain();
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.frequency.value = 800; osc.type = 'sine';
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
                    } catch(e) {}
                }
                lastOrderCount = newCount;
            }
        });
    </script>
</x-filament-panels::page>
