<x-filament-panels::page>
    <div class="font-sans dark" style="color-scheme: dark;">
        <style>
            .glass {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
        </style>

        <div class="bg-background-dark text-slate-100 rounded-2xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8" style="min-height: calc(100vh - 4rem);">
            <!-- Header Section -->
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 class="text-3xl font-black text-white tracking-tight font-sans">Produtos</h2>
                    <p class="text-slate-500 text-sm mt-1">Gerencie seu cardápio e estoque em tempo real.</p>
                </div>
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="relative group flex-1 md:flex-none">
                        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                        <input wire:model.live.debounce.300ms="search" class="w-full md:w-80 bg-surface border border-border-subtle rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:outline-none transition-all placeholder:text-slate-600" placeholder="Buscar produtos..." type="text"/>
                    </div>
                    <a href="{{ \App\Filament\Resources\ProductResource::getUrl('create') }}" class="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
                        <span class="material-symbols-outlined text-[20px]">add_circle</span>
                        Novo Produto
                    </a>
                </div>
            </header>

            <!-- Product Table Card -->
            <div class="glass rounded-2xl overflow-hidden shadow-2xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-white/5 border-b border-border-subtle">
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 font-sans">Imagem</th>
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 font-sans">Nome</th>
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 font-sans">Categoria</th>
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right font-sans">Preço</th>
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center font-sans">Cardápio Digital</th>
                                <th class="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right font-sans">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border-subtle">
                            @forelse($this->products as $product)
                            <tr class="hover:bg-white/[0.02] transition-colors" wire:key="product-{{ $product->id }}">
                                <td class="px-6 py-4">
                                    <div class="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5">
                                        @if($product->image)
                                            <div class="w-full h-full rounded-full bg-center bg-cover" style="background-image: url('{{ Storage::url($product->image) }}')"></div>
                                        @else
                                            <div class="w-full h-full rounded-full bg-surface-hover flex items-center justify-center text-slate-500">
                                                <span class="material-symbols-outlined text-[20px]">image</span>
                                            </div>
                                        @endif
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm font-bold text-white font-sans">{{ $product->name }}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border border-border-subtle text-slate-300 bg-white/5 font-sans">{{ $product->category ?: 'Sem categoria' }}</span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <span class="text-sm font-bold text-emerald-soft font-mono">R$ {{ number_format($product->price, 2, ',', '.') }}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex justify-center">
                                        <button wire:click="toggleStatus({{ $product->id }})" class="relative inline-flex items-center cursor-pointer">
                                            <div class="w-9 h-5 rounded-full transition-all flex items-center {{ $product->show_on_digital_menu ? 'bg-primary justify-end' : 'bg-slate-700 justify-start' }} px-[2px]">
                                                <div class="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                        </button>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex justify-end gap-2">
                                        <a href="{{ \App\Filament\Resources\ProductResource::getUrl('edit', ['record' => $product->id]) }}" class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors inline-block text-center">
                                            <span class="material-symbols-outlined text-[18px]">edit</span>
                                        </a>
                                        <button wire:click="deleteProduct({{ $product->id }})" wire:confirm="Tem certeza que deseja excluir este produto?" class="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                                            <span class="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                                    <span class="material-symbols-outlined text-4xl mb-3 block">inventory_2</span>
                                    <p>Nenhum produto encontrado.</p>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                @if($this->products->hasPages())
                <div class="px-6 py-4 bg-white/5 border-t border-border-subtle">
                    {{ $this->products->links('filament::components.pagination.index') }}
                </div>
                @endif
            </div>
        </div>
    </div>
</x-filament-panels::page>
