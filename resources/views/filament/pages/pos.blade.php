<x-filament-panels::page>
<div class="dark" style="color-scheme: dark;">
    <div class="bg-background-dark text-white flex flex-col overflow-hidden selection:bg-primary selection:text-white font-sans" style="margin: -2rem; min-height: calc(100vh - 4rem);">
        {{-- ==================== CASH REGISTER STATUS BAR ==================== --}}
        @if($activeRegister)
        <!-- Top Status Bar -->
        <header class="h-20 flex items-center justify-between px-8 border-b border-border-subtle bg-[#111118]/50 backdrop-blur-md shrink-0">
            <div class="flex items-center gap-6 w-full max-w-7xl mx-auto justify-between">
                <div class="flex items-center gap-6">
                    <div class="flex flex-col">
                        <span class="text-xs text-text-muted uppercase font-bold tracking-wider">Status</span>
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-emerald-soft animate-pulse"></div>
                            <span class="text-emerald-soft font-semibold text-sm">Caixa Aberto</span>
                        </div>
                    </div>
                    <div class="h-8 w-[1px] bg-border-subtle mx-2"></div>
                    <div class="flex items-center gap-6">
                        <div>
                            <p class="text-xs text-text-muted font-medium">Saldo Inicial</p>
                            <p class="text-white font-bold font-mono">R$ {{ number_format($cashSummary['opening_balance'] ?? 0, 2, ',', '.') }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-text-muted font-medium">Vendas</p>
                            <p class="text-white font-bold font-mono">{{ $cashSummary['order_count'] ?? 0 }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-text-muted font-medium">Gaveta</p>
                            <p class="text-white font-bold font-mono text-emerald-soft">R$ {{ number_format($cashSummary['total_in_drawer'] ?? 0, 2, ',', '.') }}</p>
                        </div>
                    </div>
                </div>
                <button wire:click="openClosingModal" class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold transition-all">
                    <span class="material-symbols-outlined text-[18px]">lock_outline</span>
                    Fechar Caixa
                </button>
            </div>
        </header>

        <!-- Content Grid -->
        <div class="flex flex-1 overflow-hidden" style="max-height: calc(100vh - 9rem);">
            <!-- Product Catalog (Left 65%) -->
            <div class="flex-[0.65] flex flex-col border-r border-border-subtle overflow-hidden">
                <!-- Tabs & Search -->
                <div class="p-6 pb-0 flex flex-col gap-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-2xl font-bold text-white">Catálogo</h2>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                            <input wire:model.live.debounce.300ms="searchTerm" class="bg-surface border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all" placeholder="Buscar item..." type="text"/>
                        </div>
                    </div>
                    <div class="flex gap-6 border-b border-border-subtle overflow-x-auto">
                        <button wire:click="selectCategory('all')" class="pb-4 px-2 border-b-2 {{ $selectedCategory === 'all' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white' }} font-bold text-sm transition-colors whitespace-nowrap">Todos</button>
                        @foreach($categories as $cat)
                            <button wire:click="selectCategory('{{ $cat }}')" class="pb-4 px-2 border-b-2 {{ $selectedCategory === $cat ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white' }} font-bold text-sm transition-colors whitespace-nowrap">{{ $cat }}</button>
                        @endforeach
                    </div>
                </div>
                
                <!-- Product Grid -->
                <div class="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-24" style="align-content: start;">
                    {{-- Pizzas First --}}
                    @foreach($pizzaFlavors as $flavor)
                    <div wire:click="openPizzaBuilder({{ $flavor->id }})" class="group bg-surface hover:bg-surface-hover border border-border-subtle rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 flex flex-col gap-3">
                        <div class="relative h-40 w-full rounded-xl overflow-hidden bg-[#1E1E24]">
                            <img src="{{ $flavor->image_url ?? 'https://source.unsplash.com/random/400x300/?pizza,'.str_replace(' ', ',', $flavor->name) }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white">
                                Personalizar
                            </div>
                        </div>
                        <div class="flex flex-col gap-1 flex-1">
                            <div class="flex justify-between items-start">
                                <h3 class="font-bold text-white text-lg leading-tight">{{ $flavor->name }}</h3>
                            </div>
                            <p class="text-sm text-text-muted">Pizzas</p>
                            <div class="mt-auto pt-2 flex items-center justify-between">
                                <span class="text-emerald-soft font-bold text-lg">R$ {{ number_format($flavor->base_price, 2, ',', '.') }}</span>
                                <button class="w-8 h-8 rounded-full bg-surface-hover text-white flex items-center justify-center hover:bg-primary transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    @endforeach

                    {{-- Products --}}
                    @foreach($products as $product)
                    <div wire:click="addProductToCart({{ $product->id }})" class="group bg-surface hover:bg-surface-hover border border-border-subtle rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 flex flex-col gap-3">
                        <div class="relative h-40 w-full rounded-xl overflow-hidden bg-[#1E1E24]">
                            <img src="{{ $product->image_url ?? 'https://source.unsplash.com/random/400x300/?'.str_replace(' ', ',', $product->category).',food' }}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        </div>
                        <div class="flex flex-col gap-1 flex-1">
                            <div class="flex justify-between items-start">
                                <h3 class="font-bold text-white text-lg leading-tight">{{ $product->name }}</h3>
                            </div>
                            <p class="text-sm text-text-muted">{{ $product->category }}</p>
                            <div class="mt-auto pt-2 flex items-center justify-between">
                                <span class="text-emerald-soft font-bold text-lg">R$ {{ number_format($product->price, 2, ',', '.') }}</span>
                                <button class="w-8 h-8 rounded-full bg-surface-hover text-white flex items-center justify-center hover:bg-primary transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            <!-- Cart Section (Right 35%) -->
            <div class="flex-[0.35] flex flex-col bg-[#111118] border-l border-border-subtle min-w-[320px]">
                <!-- Cart Header -->
                <div class="p-6 border-b border-border-subtle flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-white">Carrinho</h2>
                            <p class="text-xs text-text-muted">Pedido Atual</p>
                        </div>
                    </div>
                    <button wire:click="clearCart" class="text-text-muted hover:text-red-400 transition-colors">
                        <span class="material-symbols-outlined">delete_sweep</span>
                    </button>
                </div>
                
                <!-- Cart Items List -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    @if(empty($cart))
                        <div class="h-full flex flex-col justify-center items-center text-text-muted opacity-50">
                            <span class="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
                            <p>Carrinho vazio</p>
                        </div>
                    @else
                        @foreach($cart as $key => $item)
                        <div class="flex gap-3 bg-surface p-3 rounded-xl border border-transparent hover:border-border-subtle transition-all group relative">
                            <div class="w-16 h-16 rounded-lg bg-[#2D2D3A] overflow-hidden flex-shrink-0">
                                @if(isset($item['product_id']))
                                    <img src="https://source.unsplash.com/random/100x100/?{{ str_replace(' ', ',', $item['name']) }},food" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                                @else
                                    <img src="https://source.unsplash.com/random/100x100/?pizza,food" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                                @endif
                            </div>
                            <div class="flex-1 flex flex-col justify-between">
                                <div class="flex justify-between items-start">
                                    <h4 class="text-sm font-semibold text-white leading-tight pr-6">{{ $item['name'] }}</h4>
                                    <p class="text-sm font-bold text-white">R$ {{ number_format($item['subtotal'], 2, ',', '.') }}</p>
                                </div>
                                <div class="text-xs text-text-muted mt-1">{{ $item['description'] ?? '' }}</div>
                                <input type="text" wire:model.live.debounce.500ms="cart.{{ $key }}.notes" placeholder="Adic. obs..." class="w-full bg-transparent border-none border-b border-dashed border-border-subtle focus:border-primary/50 text-amber-400 text-[11px] p-0 mt-1 focus:ring-0">
                                
                                <div class="flex items-center justify-end mt-2">
                                    <div class="flex items-center bg-[#0A0A0B] rounded-lg p-1 gap-2 border border-border-subtle">
                                        <button wire:click="updateQuantity('{{ $key }}', -1)" class="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white rounded hover:bg-surface">
                                            <span class="material-symbols-outlined text-[14px]">remove</span>
                                        </button>
                                        <span class="text-xs font-bold w-4 text-center">{{ $item['quantity'] }}</span>
                                        <button wire:click="updateQuantity('{{ $key }}', 1)" class="w-5 h-5 flex items-center justify-center text-text-muted hover:text-white rounded hover:bg-surface">
                                            <span class="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button wire:click="removeItem('{{ $key }}')" class="absolute top-2 right-2 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span class="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                        @endforeach
                    @endif
                </div>

                <!-- Cart Footer -->
                <div class="p-6 border-t border-border-subtle bg-[#111118] space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
                    <div class="space-y-2">
                        <div class="flex justify-between text-xl font-bold text-white pt-2 border-t border-dashed border-border-subtle">
                            <span>Total</span>
                            <span>R$ {{ number_format($total, 2, ',', '.') }}</span>
                        </div>
                    </div>
                    <button wire:click="openPaymentModal" class="w-full py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 {{ empty($cart) ? 'opacity-50 cursor-not-allowed' : '' }}" {{ empty($cart) ? 'disabled' : '' }}>
                        Finalizar Venda
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>

        {{-- Modals from original pos.blade.php mapped correctly --}}
        <style>
            .modal-overlay { position: fixed; inset: 0; background: rgba(10,10,11,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
            .modal-content { background: #111118; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .modal-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
            .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: white; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
            .modal-body { padding: 1.5rem; overflow-y: auto; }
            .modal-footer { padding: 1.5rem; background: #0A0A0B; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid rgba(255,255,255,0.08); }
            .btn-cancel { padding: 0.75rem 1.5rem; background: transparent; color: #9ca3af; border: none; cursor: pointer; font-weight: 600; border-radius: 0.75rem; transition: all 0.2s; }
            .btn-cancel:hover { color: white; background: rgba(255,255,255,0.05); }
            .btn-primary { padding: 0.75rem 2rem; background: #8B5CF6; color: white; border: none; border-radius: 0.75rem; font-weight: 700; cursor: pointer; transition: background 0.2s; box-shadow: 0 4px 6px -1px rgba(139,92,246,0.25); }
            .btn-primary:hover:not(:disabled) { background: #7C3AED; }
            .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
            .section-title { font-size: 1rem; font-weight: 700; color: white; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem; }
            .size-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
            .size-btn { padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: #1a1a1d; color: white; cursor: pointer; text-align: center; transition: all 0.2s; }
            .size-btn:hover { border-color: rgba(255,255,255,0.15); }
            .size-btn.selected { border-color: #8B5CF6; background: rgba(139,92,246,0.1); }
            .size-name { font-weight: 700; font-size: 0.875rem; }
            .size-info { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }
            .flavors-area { min-height: 50px; padding: 0.75rem; background: #0A0A0B; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
            .flavor-tag { display: flex; align-items: center; gap: 0.5rem; background: #1a1a1d; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; color: white; border: 1px solid rgba(255,255,255,0.05); }
            .flavor-tag button { color: #9ca3af; transition: color 0.2s; }
            .flavor-tag button:hover { color: #f87171; }
            .flavors-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-height: 200px; overflow-y: auto; }
            .flavor-btn { padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: #1a1a1d; color: white; cursor: pointer; font-size: 0.8rem; text-align: left; transition: background 0.2s; }
            .flavor-btn:hover:not(:disabled) { background: #222225; }
            .flavor-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .input-field { width: 100%; border: 1px solid rgba(255,255,255,0.08); background: #0A0A0B; color: white; border-radius: 0.5rem; padding: 0.75rem; font-size: 0.875rem; }
            .input-field:focus { outline: none; border-color: #8B5CF6; box-shadow: 0 0 0 1px #8B5CF6; }
        </style>

        <!-- Pizza Builder Modal -->
        @if($showPizzaModal)
            <div class="modal-overlay" x-data @keydown.escape.window="$wire.set('showPizzaModal', false)">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><span class="text-2xl">🍕</span> Montar Pizza</h3>
                        <button class="text-text-muted hover:text-white" wire:click="$set('showPizzaModal', false)"><span class="material-symbols-outlined">close</span></button>
                    </div>

                    <div class="modal-body">
                        <div class="section-title">1. Escolha o Tamanho</div>
                        <div class="size-grid">
                            @foreach($pizzaSizes as $size)
                                <button 
                                    wire:click="selectPizzaSize({{ $size->id }})"
                                    class="size-btn {{ $currentPizza['size_id'] == $size->id ? 'selected' : '' }}"
                                >
                                    <div class="size-name">{{ $size->name }}</div>
                                    <div class="size-info">{{ $size->slices }} fatias</div>
                                    <div class="size-info">Max {{ $size->max_flavors }} sabores</div>
                                </button>
                            @endforeach
                        </div>

                        @if($currentPizza['size_id'])
                            <div class="mt-6">
                                @php
                                    $currentSize = \App\Models\PizzaSize::find($currentPizza['size_id']);
                                    $canAddMore = count($currentPizza['flavor_ids']) < $currentSize->max_flavors;
                                @endphp
                                
                                <div class="section-title">
                                    2. Sabores ({{ count($currentPizza['flavor_ids']) }}/{{ $currentSize->max_flavors }})
                                </div>
                                
                                <div class="flavors-area">
                                    @if(empty($currentPizza['flavor_ids']))
                                        <span class="text-sm text-text-muted italic">Nenhum sabor selecionado</span>
                                    @endif
                                    @foreach($currentPizza['temp_flavors'] as $index => $flavor)
                                        <div class="flavor-tag">
                                            <span>{{ $flavor->name }}</span>
                                            <button wire:click="removeFlavorFromCurrentPizza({{ $index }})"><span class="material-symbols-outlined text-[14px]">close</span></button>
                                        </div>
                                    @endforeach
                                </div>

                                @if($canAddMore)
                                    <input type="text" placeholder="Buscar sabor..." wire:model.live.debounce="flavorSearchTerm" class="input-field mb-3">
                                    <div class="flavors-list">
                                        @foreach($modalFlavors as $flavor)
                                            <button 
                                                wire:click="addFlavorToCurrentPizza({{ $flavor->id }})"
                                                class="flavor-btn"
                                                {{ in_array($flavor->id, $currentPizza['flavor_ids']) ? 'disabled' : '' }}
                                            >
                                                {{ $flavor->name }}
                                            </button>
                                        @endforeach
                                    </div>
                                @else
                                    <div class="text-center p-4 bg-emerald-500/10 text-emerald-soft rounded-lg text-sm font-semibold border border-emerald-500/20">
                                        ✅ Pizza completa! Clique em adicionar.
                                    </div>
                                @endif
                            </div>

                            @php
                                $currentSizeObj = $currentPizza['size_id'] ? $pizzaSizes->firstWhere('id', $currentPizza['size_id']) : null;
                                $canHaveBorder = $currentSizeObj && !$currentSizeObj->is_special_broto_rule;
                            @endphp
                            @if($canHaveBorder)
                            <div class="mt-6">
                                <div class="section-title">3. Borda Recheada (+R$ 20,00)</div>
                                <div class="flex flex-wrap gap-2">
                                    @foreach(\App\Filament\Pages\Pos::BORDER_OPTIONS as $key => $label)
                                        <button
                                            wire:click="$set('currentPizza.border', '{{ $key }}')"
                                            class="px-4 py-2 rounded-lg font-semibold text-sm transition-all border {{ ($currentPizza['border'] ?? '') === $key ? 'border-primary bg-primary/20 text-primary' : 'border-border-subtle bg-surface text-text-muted hover:text-white' }}"
                                        >
                                            {{ $key === '' ? '❌' : '🧀' }} {{ $label }}
                                        </button>
                                    @endforeach
                                </div>
                            </div>
                            @endif

                            <div class="mt-6">
                                <div class="section-title">{{ $canHaveBorder ? '4' : '3' }}. Observações (Opcional)</div>
                                <textarea wire:model="currentPizza.notes" placeholder="Ex: Sem cebola, massa fina, bem assada..." class="input-field resize-none" rows="2"></textarea>
                            </div>
                        @endif
                    </div>

                    <div class="modal-footer">
                        <button class="btn-cancel" wire:click="$set('showPizzaModal', false)">Cancelar</button>
                        <button class="btn-primary" wire:click="addPizzaToCart" {{ empty($currentPizza['flavor_ids']) || !$currentPizza['size_id'] ? 'disabled' : '' }}>
                            Adicionar ao Carrinho
                        </button>
                    </div>
                </div>
            </div>
        @endif

        <!-- Payment Modal -->
        @if($showPaymentModal)
            <div class="modal-overlay" x-data @keydown.escape.window="$wire.cancelPayment()">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><span class="text-2xl">💳</span> Pagamento</h3>
                        <button class="text-text-muted hover:text-white" wire:click="cancelPayment"><span class="material-symbols-outlined">close</span></button>
                    </div>

                    <div class="modal-body space-y-6">
                        <!-- Order Info -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">Cliente</label>
                                <input type="text" wire:model="customerName" class="input-field" placeholder="Nome do cliente">
                            </div>
                            <div>
                                <label class="block text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">Tipo</label>
                                <select wire:model.live="orderType" class="input-field appearance-none">
                                    <option value="pickup">🏪 Retirada</option>
                                    <option value="delivery">🛵 Delivery</option>
                                    <option value="salon">🪑 Salão</option>
                                </select>
                            </div>
                        </div>

                        <!-- Delivery Fields -->
                        @if($orderType === 'delivery')
                            <div class="bg-surface p-4 rounded-xl border border-primary/30">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="text-xl">🛵</span>
                                    <span class="font-bold text-primary text-sm uppercase tracking-wider">Dados de Entrega</span>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label class="block text-xs text-text-muted mb-1">Bairro *</label>
                                        <select wire:model.live="selectedNeighborhoodId" class="input-field appearance-none">
                                            <option value="">Selecione o bairro...</option>
                                            @foreach($neighborhoods as $nb)
                                                <option value="{{ $nb->id }}">{{ $nb->name }} — R$ {{ number_format($nb->delivery_fee, 2, ',', '.') }}</option>
                                            @endforeach
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs text-text-muted mb-1">Telefone *</label>
                                        <input type="text" wire:model="customerPhone" placeholder="(00) 00000-0000" class="input-field">
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="block text-xs text-text-muted mb-1">Endereço *</label>
                                    <input type="text" wire:model="deliveryAddress" placeholder="Rua, número" class="input-field">
                                </div>

                                <div class="mb-3">
                                    <label class="block text-xs text-text-muted mb-1">Complemento</label>
                                    <input type="text" wire:model="deliveryComplement" placeholder="Apto, bloco, referência..." class="input-field">
                                </div>

                                @if($deliveryFee > 0)
                                    <div class="flex justify-between items-center p-2 mt-3 bg-primary/10 rounded-lg border border-primary/20">
                                        <span class="text-primary text-sm font-semibold">Taxa de Entrega</span>
                                        <span class="text-primary font-bold text-sm">R$ {{ number_format($deliveryFee, 2, ',', '.') }}</span>
                                    </div>
                                @endif
                            </div>
                        @endif

                        <!-- Total Container -->
                        <div class="bg-[#111118] border border-border-subtle p-4 rounded-xl shadow-inner">
                            @if($orderType === 'delivery' && $deliveryFee > 0)
                                @php $subtotal = collect($cart)->sum('subtotal'); @endphp
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-text-muted text-sm">Subtotal</span>
                                    <span class="text-white font-medium text-sm">R$ {{ number_format($subtotal, 2, ',', '.') }}</span>
                                </div>
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-primary text-sm">🛵 Taxa de Entrega</span>
                                    <span class="text-primary font-medium text-sm">R$ {{ number_format($deliveryFee, 2, ',', '.') }}</span>
                                </div>
                                <div class="border-t border-border-subtle pt-2 mt-2">
                            @endif
                            <div class="flex justify-between items-center">
                                <span class="text-text-muted font-semibold uppercase tracking-wider text-sm">Total da Venda</span>
                                <span class="text-2xl font-bold text-emerald-soft">R$ {{ number_format($total, 2, ',', '.') }}</span>
                            </div>
                            @if($orderType === 'delivery' && $deliveryFee > 0)
                                </div>
                            @endif
                        </div>

                        <!-- Payment Methods -->
                        <div>
                            <div class="section-title">Formas de Pagamento</div>
                            <div class="flex flex-col gap-3 mb-4">
                                @foreach($payments as $index => $payment)
                                    <div class="flex gap-3 items-center">
                                        <select wire:model="payments.{{ $index }}.method" class="input-field appearance-none flex-1">
                                            <option value="dinheiro">💵 Dinheiro</option>
                                            <option value="pix">📱 PIX</option>
                                            <option value="credito">💳 Crédito</option>
                                            <option value="debito">💳 Débito</option>
                                        </select>
                                        <input type="text" inputmode="decimal" wire:model="payments.{{ $index }}.amount" class="input-field w-32 text-right font-mono font-bold" placeholder="0.00">
                                        @if(count($payments) > 1)
                                            <button wire:click="removePaymentMethod({{ $index }})" class="w-10 h-10 flex-shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 transition-colors">
                                                <span class="material-symbols-outlined text-[20px]">close</span>
                                            </button>
                                        @endif
                                    </div>
                                @endforeach
                            </div>

                            <button wire:click="addPaymentMethod" class="w-full py-2.5 bg-transparent border-2 border-dashed border-border-subtle hover:border-text-muted rounded-xl text-text-muted hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined text-[18px]">add_card</span> Adicionar forma de pagamento
                            </button>
                        </div>

                        <!-- Payment Summary -->
                        @php
                            $totalPaid = collect($payments)->sum('amount');
                            $difference = $totalPaid - $total;
                        @endphp
                        <div class="mt-4 p-4 rounded-xl border {{ $difference >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' }}">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-text-muted font-medium">Total Pago:</span>
                                <span class="font-bold text-white font-mono">R$ {{ number_format($totalPaid, 2, ',', '.') }}</span>
                            </div>
                            @if($difference > 0)
                                <div class="flex justify-between items-center mt-2 text-sm pt-2 border-t border-emerald-500/20">
                                    <span class="text-emerald-soft font-bold">Troco:</span>
                                    <span class="font-bold text-emerald-soft font-mono">R$ {{ number_format($difference, 2, ',', '.') }}</span>
                                </div>
                            @elseif($difference < 0)
                                <div class="flex justify-between items-center mt-2 text-sm pt-2 border-t border-red-500/20">
                                    <span class="text-red-400 font-bold">Faltando:</span>
                                    <span class="font-bold text-red-400 font-mono">R$ {{ number_format(abs($difference), 2, ',', '.') }}</span>
                                </div>
                            @endif
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-cancel" wire:click="cancelPayment">Cancelar</button>
                        <button class="btn-primary" wire:click="confirmPayment" {{ $totalPaid < $total ? 'disabled' : '' }}>
                            ✅ Confirmar Pagamento
                        </button>
                    </div>
                </div>
            </div>
        @endif

        {{-- ==================== CLOSE REGISTER MODAL ==================== --}}
        @if($showClosingModal)
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 550px;">
                    <div class="modal-header">
                        <h3><span class="text-2xl">🔒</span> Fechar Caixa</h3>
                        <button class="text-text-muted hover:text-white" wire:click="cancelClosing"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="modal-body">
                        {{-- Summary --}}
                        <div class="space-y-3 mb-6">
                            <div class="flex justify-between items-center pb-2 border-b border-border-subtle">
                                <span class="text-text-muted text-sm">Saldo Inicial:</span>
                                <span class="font-bold text-white font-mono">R$ {{ number_format($cashSummary['opening_balance'] ?? 0, 2, ',', '.') }}</span>
                            </div>
                            <div class="flex justify-between items-center pb-2 border-b border-border-subtle">
                                <span class="text-text-muted text-sm">Vendas Totais:</span>
                                <span class="font-bold text-emerald-soft font-mono">+ R$ {{ number_format($cashSummary['total_sales'] ?? 0, 2, ',', '.') }}</span>
                            </div>
                            @if(!empty($cashSummary['methods']))
                                <div class="pl-4 py-2 border-l-2 border-surface-hover space-y-1">
                                @foreach($cashSummary['methods'] as $method => $amount)
                                    <div class="flex justify-between items-center text-xs">
                                        <span class="text-text-muted capitalize">{{ $method }}:</span>
                                        <span class="text-text-muted font-mono">R$ {{ number_format($amount, 2, ',', '.') }}</span>
                                    </div>
                                @endforeach
                                </div>
                            @endif
                            <div class="flex justify-between items-center pb-2 border-b border-border-subtle">
                                <span class="text-text-muted text-sm">Trocos Entregues:</span>
                                <span class="font-bold text-red-400 font-mono">- R$ {{ number_format($cashSummary['total_change'] ?? 0, 2, ',', '.') }}</span>
                            </div>
                            <div class="flex justify-between items-center pt-2 text-lg">
                                <span class="font-bold text-white">Total em Gaveta:</span>
                                <span class="font-bold text-blue-400 font-mono">R$ {{ number_format($cashSummary['total_in_drawer'] ?? 0, 2, ',', '.') }}</span>
                            </div>
                        </div>

                        {{-- Closing Balance Input --}}
                        <div class="mb-4">
                            <label class="block text-sm text-white mb-2 font-semibold">Valor contado em caixa (R$)</label>
                            <input type="number" step="0.01" wire:model="closingBalance" class="w-full p-4 bg-background-dark border-2 border-border-subtle rounded-xl text-white text-xl font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors" placeholder="0.00">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm text-white mb-2 font-medium">Observações (opcional)</label>
                            <input type="text" wire:model="closingNotes" class="input-field text-sm" placeholder="Diferenças, justificativas...">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" wire:click="cancelClosing">Cancelar</button>
                        <button wire:click="closeRegister" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-colors">
                            ✅ Confirmar Fechamento
                        </button>
                    </div>
                </div>
            </div>
        @endif

        @else
        {{-- ==================== OPEN REGISTER SCREEN ==================== --}}
        <div class="flex flex-col items-center justify-center p-8 h-full bg-background-dark">
            <div class="bg-surface border border-border-subtle rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                <div class="text-7xl mb-6 drop-shadow-lg">💰</div>
                <h2 class="text-3xl font-bold text-white mb-3">Caixa Fechado</h2>
                <p class="text-text-muted mb-8 text-sm">Para iniciar as vendas, abra o caixa informando o saldo inicial (fundo de troco).</p>
                
                <div class="mb-8 text-left">
                    <label class="block text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Saldo Inicial (R$)</label>
                    <input type="number" step="0.01" wire:model="openingBalance" class="w-full p-5 bg-background-dark border-2 border-border-subtle rounded-xl text-white text-2xl font-mono text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" placeholder="0.00">
                </div>
                
                <button wire:click="openRegister" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25">
                    <span class="material-symbols-outlined text-[24px]">lock_open</span> Abrir Caixa
                </button>
            </div>
        </div>
        @endif
    </div>
</div>
</x-filament-panels::page>
