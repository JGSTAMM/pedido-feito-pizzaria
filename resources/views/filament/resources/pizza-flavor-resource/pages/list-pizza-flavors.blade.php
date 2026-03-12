<x-filament-panels::page>
    <div class="font-sans dark" style="color-scheme: dark;">
        <style>
            .glass-panel {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }
        </style>

        <div class="bg-[#0A0A0B] text-slate-100 rounded-2xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden" style="min-height: calc(100vh - 4rem);">
            <!-- Background Accent -->
            <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
            
            <div class="max-w-7xl mx-auto">
                <!-- Header -->
                <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 class="text-white text-3xl font-black tracking-tight mb-1 font-sans">Sabores de Pizzas</h2>
                        <p class="text-slate-500 text-sm">Gerencie o catálogo de sabores e ingredientes disponíveis.</p>
                    </div>
                    <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div class="relative group">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                            <input wire:model.live.debounce.300ms="search" class="w-full md:w-72 h-12 pl-12 pr-4 rounded-xl border-white/10 bg-white/[0.03] text-sm text-slate-200 focus:ring-primary focus:border-primary placeholder:text-slate-600 transition-all font-sans" placeholder="Pesquisar sabores..." type="text"/>
                        </div>
                        <a href="{{ \App\Filament\Resources\PizzaFlavorResource::getUrl('create') }}" class="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-[#7c3aed] text-white text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                            <span class="material-symbols-outlined text-[20px]">add_circle</span>
                            <span>Novo Sabor</span>
                        </a>
                    </div>
                </header>

                <!-- Flavors Table Container -->
                <div class="glass-panel rounded-2xl overflow-hidden shadow-2xl border-white/5">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] border-b border-white/5">
                                    <th class="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans opacity-80">Sabor</th>
                                    <th class="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans opacity-80">Ingredientes / Descrição</th>
                                    <th class="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans opacity-80">Preço Base</th>
                                    <th class="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans opacity-80">Status</th>
                                    <th class="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right font-sans opacity-80">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                @forelse($this->flavors as $flavor)
                                <tr class="hover:bg-white/[0.02] transition-colors group" wire:key="flavor-{{ $flavor->id }}">
                                    <td class="px-6 py-5">
                                        <div class="flex items-center gap-3">
                                            <div class="size-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5">
                                                @if($flavor->image)
                                                    <img class="w-full h-full object-cover" src="{{ Storage::url($flavor->image) }}"/>
                                                @else
                                                    <div class="w-full h-full flex items-center justify-center text-slate-500">
                                                        <span class="material-symbols-outlined text-[20px]">local_pizza</span>
                                                    </div>
                                                @endif
                                            </div>
                                            <span class="text-white font-bold text-sm font-sans">{{ $flavor->name }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-5">
                                        @if($flavor->description)
                                            <div class="text-xs text-slate-400 max-w-xs">{{ $flavor->description }}</div>
                                        @else
                                            <div class="text-xs text-slate-600 italic">Sem descrição</div>
                                        @endif
                                    </td>
                                    <td class="px-6 py-5">
                                        <span class="text-[#10B981] font-bold text-sm font-mono tracking-wide">R$ {{ number_format($flavor->base_price, 2, ',', '.') }}</span>
                                    </td>
                                    <td class="px-6 py-5">
                                        <button wire:click="toggleStatus({{ $flavor->id }})" class="relative inline-flex items-center cursor-pointer">
                                            <div class="w-11 h-6 rounded-full transition-all flex items-center px-[2px] {{ $flavor->is_active ? 'bg-primary justify-end' : 'bg-slate-800 justify-start' }}">
                                                <div class="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                            <span class="ml-3 text-xs font-medium {{ $flavor->is_active ? 'text-primary' : 'text-slate-500' }}">
                                                {{ $flavor->is_active ? 'Disponível' : 'Indisponível' }}
                                            </span>
                                        </button>
                                    </td>
                                    <td class="px-6 py-5 text-right">
                                        <div class="flex items-center justify-end gap-2 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity">
                                            <a href="{{ \App\Filament\Resources\PizzaFlavorResource::getUrl('edit', ['record' => $flavor->id]) }}" class="p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all inline-block">
                                                <span class="material-symbols-outlined text-[18px]">edit</span>
                                            </a>
                                            <button wire:click="deleteFlavor({{ $flavor->id }})" wire:confirm="Excluir este sabor?" class="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                <span class="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                @empty
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                                        <span class="material-symbols-outlined text-4xl mb-3 block">restaurant</span>
                                        <p>Nenhum sabor encontrado.</p>
                                    </td>
                                </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                    
                    @if($this->flavors->hasPages())
                    <div class="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
                        {{ $this->flavors->links('filament::components.pagination.index') }}
                    </div>
                    @endif
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 hidden sm:grid">
                    <div class="glass-panel p-6 rounded-2xl border-t border-white/5 shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                                <span class="material-symbols-outlined text-[24px]">restaurant_menu</span>
                            </div>
                            <div>
                                <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total de Sabores</p>
                                <p class="text-white text-2xl font-black font-mono">{{ \App\Models\PizzaFlavor::count() }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="glass-panel p-6 rounded-2xl border-t border-white/5 shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                                <span class="material-symbols-outlined text-[24px]">check_circle</span>
                            </div>
                            <div>
                                <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Ativos no Cardápio</p>
                                <p class="text-white text-2xl font-black font-mono">{{ \App\Models\PizzaFlavor::where('is_active', true)->count() }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="glass-panel p-6 rounded-2xl border-t border-white/5 shadow-xl">
                        <div class="flex items-center gap-4">
                            <div class="size-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                                <span class="material-symbols-outlined text-[24px]">trending_up</span>
                            </div>
                            <div>
                                <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Destaque</p>
                                <p class="text-white text-lg font-bold font-sans truncate pr-2 max-w-[150px]">{{ \App\Models\PizzaFlavor::first()->name ?? 'N/A' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>
