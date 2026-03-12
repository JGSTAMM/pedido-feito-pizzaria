<x-filament-panels::page>
    <div class="font-sans dark" style="color-scheme: dark;">
        <style>
            .glass-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .primary-gradient {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            }
        </style>

        <div class="bg-background-dark text-slate-100 rounded-2xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style="min-height: calc(100vh - 4rem);">
            
            <div class="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <!-- Header -->
                <header class="pb-8">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 class="text-3xl font-black text-white tracking-tight font-sans">Tamanhos de Pizzas</h2>
                            <p class="text-slate-400 text-sm mt-1">Configure as dimensões e regras de negócio para cada porte de pizza.</p>
                        </div>
                        <a href="{{ \App\Filament\Resources\PizzaSizeResource::getUrl('create') }}" class="primary-gradient text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform whitespace-nowrap">
                            <span class="material-symbols-outlined text-[20px]">add_circle</span>
                            Novo Tamanho
                        </a>
                    </div>

                    <!-- Filters/Search -->
                    <div class="flex gap-4 items-center">
                        <div class="relative flex-1 group">
                            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-[20px]">search</span>
                            <input wire:model.live.debounce.300ms="search" class="w-full bg-surface border-border-subtle rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-sans" placeholder="Buscar por nome do tamanho..." type="text"/>
                        </div>
                    </div>
                </header>

                <!-- Table Container -->
                <div class="flex-1">
                    <div class="glass-card rounded-xl overflow-hidden shadow-2xl">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-white/[0.02] border-b border-border-subtle">
                                        <th class="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Nome</th>
                                        <th class="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Fatias</th>
                                        <th class="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Máx. Sabores</th>
                                        <th class="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center font-sans">Regra Broto?</th>
                                        <th class="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right font-sans">Ações</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    @forelse($this->sizes as $size)
                                    <tr class="hover:bg-white/[0.02] transition-colors group" wire:key="size-{{ $size->id }}">
                                        <td class="px-6 py-5">
                                            <div class="flex items-center gap-3">
                                                <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg font-sans border border-primary/20">
                                                    {{ strtoupper(substr($size->name, 0, 1)) }}
                                                </div>
                                                <span class="text-white font-bold text-base font-sans">{{ $size->name }}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-5">
                                            <span class="text-slate-300 font-medium font-sans">{{ $size->slices }} fatias</span>
                                        </td>
                                        <td class="px-6 py-5">
                                            <span class="px-3 py-1.5 bg-white/5 border border-border-subtle rounded-full text-xs font-semibold text-slate-300 font-sans">
                                                Até {{ $size->max_flavors }} {{ $size->max_flavors == 1 ? 'sabor' : 'sabores' }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-5 text-center">
                                            @if($size->is_special_broto_rule)
                                                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500">
                                                    <span class="material-symbols-outlined text-[18px]">check</span>
                                                </span>
                                            @else
                                                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-500/10 text-slate-500">
                                                    <span class="material-symbols-outlined text-[18px]">close</span>
                                                </span>
                                            @endif
                                        </td>
                                        <td class="px-6 py-5 text-right">
                                            <div class="flex items-center justify-end gap-2 opacity-100 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity">
                                                <a href="{{ \App\Filament\Resources\PizzaSizeResource::getUrl('edit', ['record' => $size->id]) }}" class="p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all inline-block">
                                                    <span class="material-symbols-outlined text-[18px]">edit</span>
                                                </a>
                                                <button wire:click="deleteSize({{ $size->id }})" wire:confirm="Excluir este tamanho?" class="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    @empty
                                    <tr>
                                        <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                                            <span class="material-symbols-outlined text-4xl mb-3 block">aspect_ratio</span>
                                            <p>Nenhum tamanho encontrado.</p>
                                        </td>
                                    </tr>
                                    @endforelse
                                </tbody>
                            </table>
                        </div>
                        
                        @if($this->sizes->hasPages())
                        <div class="px-6 py-4 flex items-center justify-between border-t border-border-subtle bg-white/[0.01]">
                            {{ $this->sizes->links('filament::components.pagination.index') }}
                        </div>
                        @endif
                    </div>
                </div>

                <!-- Footer Stats -->
                <footer class="mt-8 pb-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="glass-card p-4 rounded-xl shadow-lg border border-border-subtle">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <span class="material-symbols-outlined text-[24px]">aspect_ratio</span>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Tamanhos</p>
                                    <p class="text-xl font-black text-white font-mono">{{ \App\Models\PizzaSize::count() }} Ativos</p>
                                </div>
                            </div>
                        </div>
                        <div class="glass-card p-4 rounded-xl shadow-lg border border-border-subtle">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                                    <span class="material-symbols-outlined text-[24px]">pie_chart</span>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Média de Fatias</p>
                                    <p class="text-xl font-black text-white font-mono">{{ round(\App\Models\PizzaSize::avg('slices') ?? 0, 1) }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="glass-card p-4 rounded-xl shadow-lg border border-border-subtle">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 shadow-inner">
                                    <span class="material-symbols-outlined text-[24px]">history</span>
                                </div>
                                <div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Última Alteração</p>
                                    <p class="text-xl font-black text-white text-sm mt-1 truncate">{{ \App\Models\PizzaSize::latest('updated_at')->first()?->updated_at->format('d/m/Y H:i') ?? 'Nenhuma' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    </div>
</x-filament-panels::page>
