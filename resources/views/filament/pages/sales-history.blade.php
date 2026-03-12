<x-filament-panels::page>
    <style>
        .sales-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .filters-section {
            background: var(--fi-bg, #1e293b);
            border-radius: 0.75rem;
            padding: 1.5rem;
        }
        .filters-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-end;
        }
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.375rem;
        }
        .filter-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .filter-input {
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            border: 1px solid #4b5563;
            background: #374151;
            color: white;
            font-size: 0.875rem;
        }
        .filter-input:focus {
            outline: none;
            border-color: #10b981;
        }
        .quick-btns {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .quick-btn {
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            border: 1px solid #4b5563;
            background: #374151;
            color: #d1d5db;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .quick-btn:hover {
            background: #4b5563;
            border-color: #10b981;
            color: white;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        .stat-card {
            background: var(--fi-bg, #1e293b);
            border-radius: 0.75rem;
            padding: 1.5rem;
            text-align: center;
        }
        .stat-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #10b981;
        }
        .stat-label {
            font-size: 0.875rem;
            color: #9ca3af;
            margin-top: 0.25rem;
        }
        .payment-breakdown {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: 1rem;
            justify-content: center;
        }
        .payment-item {
            background: #374151;
            padding: 0.75rem 1.25rem;
            border-radius: 0.5rem;
            text-align: center;
            min-width: 120px;
        }
        .payment-method {
            font-size: 0.75rem;
            color: #9ca3af;
        }
        .payment-value {
            font-weight: 700;
            color: white;
            margin-top: 0.25rem;
        }
        .orders-section {
            background: var(--fi-bg, #1e293b);
            border-radius: 0.75rem;
            overflow: hidden;
        }
        .orders-header {
            padding: 1rem 1.5rem;
            background: #111827;
            border-bottom: 1px solid #374151;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .orders-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: white;
        }
        .orders-count {
            font-size: 0.875rem;
            color: #9ca3af;
        }
        .orders-table {
            width: 100%;
            border-collapse: collapse;
        }
        .orders-table th {
            background: #374151;
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .orders-table td {
            padding: 1rem;
            border-bottom: 1px solid #374151;
            color: #e5e7eb;
            font-size: 0.875rem;
        }
        .orders-table tr:hover td {
            background: #374151;
        }
        .order-id {
            font-weight: 700;
            color: #10b981;
        }
        .order-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .badge-completed {
            background: #10b981;
            color: white;
        }
        .badge-pending {
            background: #f59e0b;
            color: white;
        }
        .badge-cancelled {
            background: #ef4444;
            color: white;
        }
        .badge-preparing {
            background: #3b82f6;
            color: white;
        }
        .order-payments {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }
        .order-payment-tag {
            background: #4b5563;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.7rem;
        }
        .order-items {
            font-size: 0.75rem;
            color: #9ca3af;
            max-width: 300px;
        }
        .order-total {
            font-weight: 700;
            color: #10b981;
            font-size: 1rem;
        }
        .empty-state {
            padding: 4rem 2rem;
            text-align: center;
            color: #6b7280;
        }
        .empty-icon {
            font-size: 4rem;
            opacity: 0.5;
            margin-bottom: 1rem;
        }
        .view-details-btn {
            padding: 0.375rem 0.75rem;
            background: #374151;
            color: #d1d5db;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            cursor: pointer;
        }
        .view-details-btn:hover {
            background: #4b5563;
        }
    </style>

    <div class="sales-container">
        <!-- Filters Section -->
        <div class="filters-section">
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">Data Inicial</label>
                    <input type="date" wire:model.live="dateFrom" class="filter-input">
                </div>
                <div class="filter-group">
                    <label class="filter-label">Data Final</label>
                    <input type="date" wire:model.live="dateTo" class="filter-input">
                </div>
                <div class="filter-group">
                    <label class="filter-label">Status</label>
                    <select wire:model.live="statusFilter" class="filter-input">
                        @foreach($this->getStatusOptions() as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Forma de Pagamento</label>
                    <select wire:model.live="paymentMethodFilter" class="filter-input">
                        @foreach($this->getPaymentMethodOptions() as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="quick-btns" style="margin-top: 1rem;">
                <button wire:click="setToday" class="quick-btn">📅 Hoje</button>
                <button wire:click="setYesterday" class="quick-btn">⏪ Ontem</button>
                <button wire:click="setThisWeek" class="quick-btn">📆 Esta Semana</button>
                <button wire:click="setThisMonth" class="quick-btn">🗓️ Este Mês</button>
                <button wire:click="setLastMonth" class="quick-btn">📋 Mês Passado</button>
            </div>
        </div>

        <!-- Stats Section -->
        @php $summary = $this->getSummary(); @endphp
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">R$ {{ number_format($summary['totalSales'], 2, ',', '.') }}</div>
                <div class="stat-label">Faturamento Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-value">{{ $summary['totalOrders'] }}</div>
                <div class="stat-label">Total de Vendas</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">R$ {{ number_format($summary['avgTicket'], 2, ',', '.') }}</div>
                <div class="stat-label">Ticket Médio</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💳</div>
                <div class="stat-value">{{ count($summary['paymentBreakdown']) }}</div>
                <div class="stat-label">Formas de Pagamento</div>
                @if(!empty($summary['paymentBreakdown']))
                    <div class="payment-breakdown">
                        @foreach($summary['paymentBreakdown'] as $method => $amount)
                            <div class="payment-item">
                                <div class="payment-method">{{ ucfirst($method) }}</div>
                                <div class="payment-value">R$ {{ number_format($amount, 2, ',', '.') }}</div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

        <!-- Orders Table -->
        <div class="orders-section">
            <div class="orders-header">
                <span class="orders-title">📊 Registro de Vendas</span>
                <span class="orders-count">{{ $this->getOrders()->count() }} registro(s)</span>
            </div>
            
            @if($this->getOrders()->count() > 0)
                <table class="orders-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Data/Hora</th>
                            <th>Mesa/Cliente</th>
                            <th>Itens</th>
                            <th>Pagamento</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($this->getOrders() as $order)
                            <tr>
                                <td><span class="order-id">#{{ $order->id }}</span></td>
                                <td>{{ $order->created_at->format('d/m/Y H:i') }}</td>
                                <td>
                                    @if($order->table)
                                        🪑 {{ $order->table->name }}
                                    @elseif($order->customer_name)
                                        👤 {{ $order->customer_name }}
                                    @else
                                        -
                                    @endif
                                </td>
                                <td>
                                    <div class="order-items">
                                        @foreach($order->items->take(3) as $item)
                                            • {{ $item->quantity }}x 
                                            @if($item->product)
                                                {{ $item->product->name }}
                                            @elseif($item->pizzaSize)
                                                Pizza {{ $item->pizzaSize->name }}
                                            @endif
                                            <br>
                                        @endforeach
                                        @if($order->items->count() > 3)
                                            <em>+{{ $order->items->count() - 3 }} mais...</em>
                                        @endif
                                    </div>
                                </td>
                                <td>
                                    <div class="order-payments">
                                        @forelse($order->payments as $payment)
                                            <span class="order-payment-tag">
                                                {{ ucfirst($payment->method) }}
                                            </span>
                                        @empty
                                            <span style="color: #6b7280;">-</span>
                                        @endforelse
                                    </div>
                                </td>
                                <td>
                                    @php
                                        $badgeClass = match($order->status) {
                                            'completed' => 'badge-completed',
                                            'pending' => 'badge-pending',
                                            'cancelled' => 'badge-cancelled',
                                            'preparing' => 'badge-preparing',
                                            default => 'badge-pending'
                                        };
                                        $statusLabel = match($order->status) {
                                            'completed' => 'Finalizado',
                                            'pending' => 'Pendente',
                                            'cancelled' => 'Cancelado',
                                            'preparing' => 'Preparando',
                                            default => ucfirst($order->status)
                                        };
                                    @endphp
                                    <span class="order-badge {{ $badgeClass }}">{{ $statusLabel }}</span>
                                </td>
                                <td><span class="order-total">R$ {{ number_format($order->total_amount, 2, ',', '.') }}</span></td>
                                <td>
                                    <a href="{{ route('filament.admin.resources.orders.edit', $order) }}" class="view-details-btn">
                                        Ver Detalhes
                                    </a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p style="font-size: 1.125rem; font-weight: 600;">Nenhuma venda encontrada</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Tente ajustar os filtros de data ou status</p>
                </div>
            @endif
        </div>
    </div>
</x-filament-panels::page>
