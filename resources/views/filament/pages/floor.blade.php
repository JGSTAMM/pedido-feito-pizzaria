<x-filament-panels::page>
<div class="dark" style="color-scheme: dark;">
    <div class="floor-page font-sans bg-background-dark text-white rounded-2xl border border-border-subtle" style="margin: -2rem; min-height: calc(100vh - 4rem);">
        <style>
            .floor-container {
                position: relative;
                background-color: #0A0A0B;
                background-image: radial-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px);
                background-size: 24px 24px;
                min-height: 700px;
                overflow: hidden;
                border-radius: 0 0 1rem 1rem;
            }
            .ios-blur {
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }
            .table-element {
                position: absolute;
                cursor: pointer;
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 0.75rem;
                user-select: none;
                overflow: hidden;
            }
            .table-element:active { transform: scale(0.95); }
            .table-available {
                background: #111113;
                border: 2px solid rgba(16, 185, 129, 0.3);
            }
            .table-available .table-status-text { color: #10B981; }
            .table-occupied {
                background: #111113;
                border: 2px solid #FBBF24;
                box-shadow: 0 10px 15px -3px rgba(251, 191, 36, 0.15);
            }
            .table-occupied .table-status-text { color: #FBBF24; }
            
            .table-element.edit-mode {
                cursor: grab;
                animation: pulse-edit 2s infinite;
            }
            @keyframes pulse-edit {
                0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
            }
            
            /* Reference elements */
            .reference-element {
                position: absolute;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 0.5rem;
                font-weight: 700;
                color: white;
                font-size: 0.875rem;
                opacity: 0.9;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
            }
            .reference-element.edit-mode {
                cursor: grab;
                animation: pulse-edit 2s infinite;
                pointer-events: auto;
            }
        </style>

        <!-- Header -->
        <header class="px-8 py-6 bg-background-dark/80 ios-blur sticky top-0 z-40 border-b border-border-subtle rounded-t-2xl">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <span class="material-symbols-outlined text-3xl text-primary">grid_view</span>
                    Mapa do Salão
                </h1>

                <div class="flex items-center gap-6">
                    <button class="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all {{ $editMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface hover:bg-surface-hover border border-border-subtle text-white' }}" wire:click="toggleEditMode">
                        @if($editMode) 
                            <span class="material-symbols-outlined text-[20px]">check</span> Salvar Layout 
                        @else 
                            <span class="material-symbols-outlined text-[20px]">edit_square</span> Editar Layout 
                        @endif
                    </button>
                    <button class="flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-hover text-white border border-border-subtle rounded-xl text-sm font-bold transition-all" wire:click="loadTables">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> Atualizar
                    </button>
                </div>
            </div>

            <div class="flex items-center justify-between mt-2">
                <!-- Legend -->
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-soft shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Livre</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                        <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Ocupada</span>
                    </div>
                </div>

                <!-- Element Visibility Toggles -->
                @php $allElements = App\Models\FloorElement::all(); @endphp
                <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold text-text-muted uppercase tracking-wider mr-2">Mostrar:</span>
                    @foreach($allElements as $el)
                        <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all {{ $el->visible ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface border border-border-subtle text-text-muted hover:text-white' }}" wire:click="toggleElementVisibility({{ $el->id }})">
                            <span>{{ $el->icon }}</span> {{ $el->name }}
                        </button>
                    @endforeach
                </div>
            </div>
        </header>

        <div class="floor-container relative" id="floorPlan" wire:poll.10s="loadTables">
            @foreach($tables as $table)
                <div 
                    class="table-element table-{{ $table['status'] }} {{ $editMode ? 'edit-mode' : '' }} flex flex-col justify-between"
                    style="left: {{ $table['position_x'] }}px; top: {{ $table['position_y'] }}px; width: {{ $table['width'] }}px; height: {{ $table['height'] }}px;"
                    data-table-id="{{ $table['id'] }}"
                    wire:key="table-{{ $table['id'] }}"
                    @if(!$editMode) wire:click="openTableModal({{ $table['id'] }})" @endif
                >
                    <div class="p-3">
                        <span class="table-status-text text-[10px] font-bold uppercase tracking-widest">
                            {{ $table['status'] === 'available' || $table['status'] === 'livre' ? 'Disponível' : 'Em Uso' }}
                        </span>
                        <h3 class="text-lg font-bold text-white mt-1 leading-tight">{{ $table['name'] }}</h3>
                    </div>

                    <div class="p-3 bg-black/40 backdrop-blur-sm border-t border-border-subtle mt-1">
                        @if($table['orders_count'] > 0)
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold text-text-muted uppercase tracking-widest">Subtotal</span>
                                <span class="table-status-text text-sm font-bold font-mono">R$ {{ number_format($table['total_amount'], 2, ',', '.') }}</span>
                            </div>
                            @if($table['orders_count'] > 0)
                                <div class="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg shadow-primary/30">
                                    {{ $table['orders_count'] }} ped
                                </div>
                            @endif
                        @else
                            <div class="flex items-center gap-1.5 text-text-muted">
                                <span class="material-symbols-outlined text-[14px]">group</span>
                                <span class="text-[10px] font-bold">Livre</span>
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach

            <!-- Dynamic Reference Elements -->
            @foreach($floorElements as $element)
                <div 
                    class="reference-element {{ $editMode ? 'edit-mode' : '' }}"
                    style="left: {{ $element['position_x'] }}px; top: {{ $element['position_y'] }}px; width: {{ $element['width'] }}px; height: {{ $element['height'] }}px; background: linear-gradient(135deg, {{ $element['bg_color'] }}, {{ $element['bg_color'] }}dd); border: 2px dashed {{ $element['border_color'] }};"
                    data-element-id="{{ $element['id'] }}"
                    wire:key="element-{{ $element['id'] }}"
                >
                    <span class="text-2xl mb-1">{{ $element['icon'] }}</span>
                    <span class="text-sm font-bold tracking-wide">{{ $element['name'] }}</span>
                </div>
            @endforeach
        </div>

        <script>
            (function() {
                let isDragging = false;
                let currentElement = null;
                let elementType = null; // 'table' or 'element'
                let offsetX = 0, offsetY = 0;
                
                document.addEventListener('mousedown', function(e) {
                    let target = e.target.closest('.table-element.edit-mode');
                    if (target) {
                        elementType = 'table';
                    } else {
                        target = e.target.closest('.reference-element.edit-mode');
                        if (target) {
                            elementType = 'element';
                        }
                    }
                    if (!target) return;
                    e.preventDefault();
                    currentElement = target;
                    isDragging = true;
                    currentElement.style.opacity = '0.7';
                    currentElement.style.cursor = 'grabbing';
                    currentElement.style.zIndex = '100';
                    const rect = currentElement.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                });
                
                document.addEventListener('mousemove', function(e) {
                    if (!isDragging || !currentElement) return;
                    const floorPlan = document.getElementById('floorPlan');
                    if (!floorPlan) return;
                    const floorRect = floorPlan.getBoundingClientRect();
                    let x = e.clientX - floorRect.left - offsetX;
                    let y = e.clientY - floorRect.top - offsetY;
                    x = Math.max(0, Math.min(x, floorRect.width - currentElement.offsetWidth));
                    y = Math.max(0, Math.min(y, floorRect.height - currentElement.offsetHeight));
                    currentElement.style.left = x + 'px';
                    currentElement.style.top = y + 'px';
                });
                
                document.addEventListener('mouseup', function(e) {
                    if (!isDragging || !currentElement) return;
                    const x = parseInt(currentElement.style.left) || 0;
                    const y = parseInt(currentElement.style.top) || 0;
                    if (window.Livewire) {
                        if (elementType === 'table') {
                            const tableId = currentElement.dataset.tableId;
                            Livewire.dispatch('updateTablePosition', { tableId: parseInt(tableId), x: x, y: y });
                        } else if (elementType === 'element') {
                            const elementId = currentElement.dataset.elementId;
                            Livewire.dispatch('updateElementPosition', { elementId: parseInt(elementId), x: x, y: y });
                        }
                    }
                    currentElement.style.opacity = '1';
                    currentElement.style.cursor = 'grab';
                    currentElement.style.zIndex = '10';
                    isDragging = false;
                    currentElement = null;
                    elementType = null;
                });
            })();
        </script>
    </div>

    {{-- TABLE DETAIL / CLOSE MODAL --}}
    @if($showTableModal)
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" x-data @keydown.escape.window="$wire.cancelTableModal()">
            <div class="bg-[#111113] border border-border-subtle rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl font-sans">
                <div class="p-5 border-b border-border-subtle flex justify-between items-center bg-[#0A0A0B]">
                    <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-3xl">deck</span>
                        {{ $selectedTableData['name'] ?? 'Mesa' }}
                    </h3>
                    <button class="text-text-muted hover:text-white bg-surface hover:bg-surface-hover rounded-lg p-2 transition-colors" wire:click="cancelTableModal">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div class="p-6 overflow-y-auto flex-1 bg-background-dark">
                    @if(empty($tableOrders))
                        <div class="py-12 flex flex-col items-center justify-center text-center">
                            <span class="material-symbols-outlined text-[64px] text-emerald-soft mb-4">check_circle</span>
                            <h4 class="text-xl font-bold text-white mb-2">Esta mesa está livre!</h4>
                            <p class="text-text-muted mb-8 text-sm">Pronta para receber novos clientes.</p>
                            <a href="/admin/pos?table={{ $selectedTableId }}" 
                               class="px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center gap-2">
                                <span class="material-symbols-outlined">shopping_cart</span> Abrir Conta
                            </a>
                        </div>
                    @else
                        {{-- Orders List --}}
                        <div class="space-y-4 mb-6">
                        @foreach($tableOrders as $order)
                            <div class="bg-surface border border-border-subtle rounded-xl p-5 hover:border-primary/30 transition-colors">
                                <div class="flex justify-between items-center mb-4 pb-3 border-b border-border-subtle">
                                    <strong class="text-primary font-bold text-lg">Pedido #{{ $order['id'] }}</strong>
                                    <span class="text-xs text-text-muted flex items-center gap-2">
                                        <span class="material-symbols-outlined text-[14px]">schedule</span> {{ $order['created_at'] }}
                                        <span class="mx-1">•</span>
                                        <span class="material-symbols-outlined text-[14px]">person</span> {{ $order['waiter'] }}
                                    </span>
                                </div>
                                <div class="space-y-3">
                                @foreach($order['items'] as $item)
                                    <div class="flex justify-between items-start text-sm">
                                        <div class="flex gap-3 text-white w-full pr-4">
                                            <span class="font-bold text-text-muted w-6 text-right">{{ $item['qty'] }}x</span>
                                            <span class="flex-1 font-medium">{{ $item['name'] }}</span>
                                        </div>
                                        <span class="font-bold text-white shrink-0 font-mono">R$ {{ number_format($item['subtotal'], 2, ',', '.') }}</span>
                                    </div>
                                    @if(!empty($item['notes']))
                                        <div class="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg border-l-2 border-amber-500 ml-9 italic max-w-sm">📝 {{ $item['notes'] }}</div>
                                    @endif
                                @endforeach
                                </div>
                                <div class="text-right mt-4 pt-3 border-t border-border-subtle">
                                    <span class="text-xs text-text-muted uppercase tracking-wider font-bold mr-3">Subtotal</span>
                                    <span class="font-bold text-white text-lg font-mono">R$ {{ number_format($order['total'], 2, ',', '.') }}</span>
                                </div>
                            </div>
                        @endforeach
                        </div>

                        {{-- Total --}}
                        <div class="bg-primary/20 border border-primary/30 rounded-xl p-5 flex justify-between items-center mb-6 shadow-lg">
                            <span class="text-white text-lg font-bold uppercase tracking-wider">Total da Mesa</span>
                            <span class="text-3xl font-bold text-white font-mono">R$ {{ number_format($tableTotal, 2, ',', '.') }}</span>
                        </div>

                        {{-- Payment --}}
                        <div>
                            <h4 class="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">💳 Forma de Pagamento</h4>
                            <div class="space-y-3 mb-4">
                            @foreach($payments as $index => $payment)
                                <div class="flex gap-3 items-center">
                                    <select wire:model="payments.{{ $index }}.method" class="flex-1 bg-background-dark border border-border-subtle text-white text-sm rounded-xl px-4 py-3 focus:border-primary focus:ring-0 appearance-none">
                                        <option value="dinheiro">💵 Dinheiro</option>
                                        <option value="pix">📱 PIX</option>
                                        <option value="credito">💳 Crédito</option>
                                        <option value="debito">💳 Débito</option>
                                    </select>
                                    <input type="text" inputmode="decimal" wire:model="payments.{{ $index }}.amount" placeholder="0.00" class="w-32 text-right font-mono font-bold bg-background-dark border border-border-subtle text-white rounded-xl px-4 py-3 focus:border-primary focus:ring-0">
                                    @if(count($payments) > 1)
                                        <button class="w-12 h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors shrink-0" wire:click="removePaymentMethod({{ $index }})">
                                            <span class="material-symbols-outlined">close</span>
                                        </button>
                                    @endif
                                </div>
                            @endforeach
                            </div>
                            <button class="w-full py-3 bg-transparent border-2 border-dashed border-border-subtle hover:border-text-muted rounded-xl text-text-muted hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2" wire:click="addPaymentMethod">
                                <span class="material-symbols-outlined text-[18px]">add_circle</span> Dividir pagamento
                            </button>

                            {{-- Payment Summary --}}
                            @php
                                $totalPaid = collect($payments)->sum('amount');
                                $difference = $totalPaid - $tableTotal;
                            @endphp
                            <div class="mt-4 p-4 rounded-xl border {{ $difference >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' }}">
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-text-muted font-medium">Total Pago:</span>
                                    <span class="font-bold text-white font-mono">R$ {{ number_format($totalPaid, 2, ',', '.') }}</span>
                                </div>
                                @if($difference > 0)
                                    <div class="flex justify-between items-center mt-2 text-sm pt-2 border-t border-emerald-500/20">
                                        <span class="text-emerald-soft font-bold uppercase tracking-wider text-xs">Troco:</span>
                                        <span class="font-bold text-emerald-soft font-mono">R$ {{ number_format($difference, 2, ',', '.') }}</span>
                                    </div>
                                @elseif($difference < 0)
                                    <div class="flex justify-between items-center mt-2 text-sm pt-2 border-t border-red-500/20">
                                        <span class="text-red-400 font-bold uppercase tracking-wider text-xs">Faltando:</span>
                                        <span class="font-bold text-red-400 font-mono">R$ {{ number_format(abs($difference), 2, ',', '.') }}</span>
                                    </div>
                                @endif
                            </div>
                        </div>
                    @endif
                </div>

                <div class="p-5 border-t border-border-subtle bg-[#0A0A0B] flex justify-end items-center gap-4">
                    <button class="px-6 py-3 bg-surface hover:bg-surface-hover border border-border-subtle text-white rounded-xl transition-colors font-bold text-sm" wire:click="cancelTableModal">Fechar</button>
                    @if(!empty($tableOrders))
                        <a href="/admin/pos?table={{ $selectedTableId }}" 
                           class="flex items-center gap-2 px-6 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded-xl font-bold transition-all text-sm">
                            <span class="material-symbols-outlined text-[18px]">add</span> Pedido
                        </a>
                        @php $totalPaidFooter = collect($payments)->sum('amount'); @endphp
                        <button 
                            class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
                            wire:click="closeTable"
                            {{ $totalPaidFooter < $tableTotal ? 'disabled' : '' }}
                        >
                            <span class="material-symbols-outlined text-[18px]">done_all</span> Encerrar Mesa
                        </button>
                    @endif
                </div>
            </div>
        </div>
    @endif
</div>
</x-filament-panels::page>
