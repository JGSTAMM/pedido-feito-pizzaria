<x-filament-widgets::widget>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <!-- Card 1: Sales -->
        <div class="group relative overflow-hidden rounded-[20px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all hover:border-primary-400 dark:hover:border-primary-500/50 shadow-sm dark:shadow-lg">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div class="flex items-start justify-between relative z-10">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Vendas Hoje</p>
                    <h3 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">R$ {{ number_format($totalSalesToday, 2, ',', '.') }}</h3>
                </div>
                <div class="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-500">
                    <x-heroicon-o-currency-dollar class="w-6 h-6" />
                </div>
            </div>
            <div class="mt-4 flex items-center gap-2 relative z-10">
                <span class="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                    <x-heroicon-o-arrow-trending-up class="w-3 h-3" />
                    +12%
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-500">vs. Ontem</span>
            </div>
        </div>

        <!-- Card 2: Active Orders -->
        <div class="group relative overflow-hidden rounded-[20px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all hover:border-primary-400 dark:hover:border-primary-500/50 shadow-sm dark:shadow-lg">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-500/10 blur-xl group-hover:bg-primary-500/20 transition-all"></div>
            <div class="flex items-start justify-between relative z-10">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos Ativos</p>
                    <h3 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ $activeOrders }}</h3>
                </div>
                <div class="rounded-lg bg-primary-500/10 p-2 text-primary-600 dark:text-primary-500">
                    <x-heroicon-o-clock class="w-6 h-6" />
                </div>
            </div>
            <div class="mt-4 flex items-center gap-2 relative z-10">
                <span class="text-xs text-gray-400 dark:text-gray-500">Tempo médio: <span class="text-gray-900 dark:text-white font-medium">45 min</span></span>
                <div class="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-800 ml-2">
                    <div class="h-1.5 w-[65%] rounded-full bg-primary-500"></div>
                </div>
            </div>
        </div>

        <!-- Card 3: Tables -->
        <div class="group relative overflow-hidden rounded-[20px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all hover:border-primary-400 dark:hover:border-primary-500/50 shadow-sm dark:shadow-lg">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all"></div>
            <div class="flex items-start justify-between relative z-10">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Mesas Abertas</p>
                    <h3 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ $openTables }}<span class="text-lg text-gray-400 dark:text-gray-600 font-normal">/10</span></h3>
                </div>
                <div class="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-500">
                    <x-heroicon-o-table-cells class="w-6 h-6" />
                </div>
            </div>
            <div class="mt-4 flex items-center gap-2 relative z-10">
                <span class="text-xs text-gray-400 dark:text-gray-500">Ocupação:</span>
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">{{ $openTables * 10 }}%</span>
            </div>
        </div>

        <!-- Card 4: Delivery Ready -->
        <div class="group relative overflow-hidden rounded-[20px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-all hover:border-primary-400 dark:hover:border-primary-500/50 shadow-sm dark:shadow-lg">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all"></div>
            <div class="flex items-start justify-between relative z-10">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pronto p/ Entrega</p>
                    <h3 class="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ $readyToDeliver }}</h3>
                </div>
                <div class="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-500">
                    <x-heroicon-o-check-circle class="w-6 h-6" />
                </div>
            </div>
            <div class="mt-4 flex -space-x-2 overflow-hidden relative z-10 px-2">
                <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-700 dark:text-white font-bold z-30">JD</div>
                <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-[10px] text-gray-700 dark:text-white font-bold z-20">AS</div>
                <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-500 flex items-center justify-center text-[10px] text-white font-bold z-10">MC</div>
            </div>
        </div>
    </div>
</x-filament-widgets::widget>
