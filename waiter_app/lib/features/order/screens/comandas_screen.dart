import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';

class ComandasScreen extends StatefulWidget {
  const ComandasScreen({super.key});

  @override
  State<ComandasScreen> createState() => _ComandasScreenState();
}

class _ComandasScreenState extends State<ComandasScreen> {
  final ApiService _apiService = ApiService();
  bool isLoading = true;
  String? error;
  List<dynamic> allOrders = [];
  List<dynamic> filteredOrders = [];
  String selectedFilter = 'all';

  final Map<String, String> filterLabels = {
    'all': 'Todos',
    'pending': 'Pendente',
    'preparing': 'Preparando',
    'ready': 'Pronto',
    'delivered': 'Entregue',
  };

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  // Helper to safely parse numbers
  double _parseDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0;
    return 0;
  }

  String _formatCurrency(dynamic value) {
    final number = _parseDouble(value);
    return number.toStringAsFixed(2).replaceAll('.', ',');
  }

  void _applyFilter(String filter) {
    setState(() {
      selectedFilter = filter;
      if (filter == 'all') {
        filteredOrders = List.from(allOrders);
      } else {
        filteredOrders = allOrders.where((order) => order['status'] == filter).toList();
      }
    });
  }

  Future<void> _loadOrders() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.dio.get('/orders/active');

      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          allOrders = data['orders'] ?? [];
          _applyFilter(selectedFilter);
          isLoading = false;
        });
      } else {
        setState(() {
          error = 'Erro ao carregar comandas';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Erro de conexão: $e';
        isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'preparing':
        return Colors.blue;
      case 'ready':
        return Colors.green;
      case 'delivered':
        return Colors.teal;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    return filterLabels[status] ?? status;
  }

  int _getCountByStatus(String status) {
    if (status == 'all') return allOrders.length;
    return allOrders.where((o) => o['status'] == status).length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Comandas'),
        backgroundColor: Colors.deepOrange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: const Color(0xFF1E1E1E),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: filterLabels.entries.map((entry) {
                  final isSelected = selectedFilter == entry.key;
                  final count = _getCountByStatus(entry.key);
                  final color = entry.key == 'all' ? Colors.deepOrange : _getStatusColor(entry.key);
                  
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(entry.value),
                          if (count > 0) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.white : color,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$count',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? color : Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      selectedColor: color,
                      checkmarkColor: Colors.white,
                      backgroundColor: const Color(0xFF2A2A2A),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey.shade300,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (_) => _applyFilter(entry.key),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          // Content
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(error!, style: const TextStyle(color: Colors.red)),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _loadOrders,
                              child: const Text('Tentar novamente'),
                            ),
                          ],
                        ),
                      )
                    : filteredOrders.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                                const SizedBox(height: 16),
                                Text(
                                  selectedFilter == 'all' 
                                      ? 'Nenhuma comanda ativa' 
                                      : 'Nenhuma comanda ${_getStatusLabel(selectedFilter).toLowerCase()}',
                                  style: const TextStyle(fontSize: 18, color: Colors.grey),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadOrders,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: filteredOrders.length,
                              itemBuilder: (context, index) {
                                final order = filteredOrders[index];
                                final items = order['items'] as List;
                                
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  elevation: 3,
                                  color: const Color(0xFF2A2A2A),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Header do pedido
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(order['status']).withValues(alpha: 0.25),
                                          borderRadius: const BorderRadius.only(
                                            topLeft: Radius.circular(12),
                                            topRight: Radius.circular(12),
                                          ),
                                        ),
                                        child: Column(
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                      decoration: BoxDecoration(
                                                        color: Colors.deepOrange,
                                                        borderRadius: BorderRadius.circular(8),
                                                      ),
                                                      child: Text(
                                                        '#${order['id']}',
                                                        style: const TextStyle(
                                                          color: Colors.white,
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 16,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 10),
                                                    Icon(Icons.table_restaurant, size: 20, color: Colors.grey.shade400),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      order['table_name'] ?? 'Balcão',
                                                      style: const TextStyle(
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 16,
                                                        color: Colors.white,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                Text(
                                                  order['created_at'] ?? '',
                                                  style: TextStyle(
                                                    color: Colors.grey.shade400,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 12,
                                                    vertical: 4,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: _getStatusColor(order['status']),
                                                    borderRadius: BorderRadius.circular(20),
                                                  ),
                                                  child: Text(
                                                    _getStatusLabel(order['status']),
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ),
                                                Text(
                                                  'R\$ ${_formatCurrency(order['total_amount'])}',
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 18,
                                                    color: Colors.deepOrange,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Itens do pedido
                                      ListView.separated(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        itemCount: items.length,
                                        separatorBuilder: (_, _) => const Divider(height: 1),
                                        itemBuilder: (context, itemIndex) {
                                          final item = items[itemIndex];
                                          final hasNotes = item['notes'] != null && item['notes'].toString().isNotEmpty;
                                          return Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Icon(
                                                      item['type'] == 'pizza' 
                                                          ? Icons.local_pizza 
                                                          : Icons.fastfood,
                                                      color: item['type'] == 'pizza' 
                                                          ? Colors.orange 
                                                          : Colors.green,
                                                      size: 20,
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Expanded(
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        children: [
                                                          Text(
                                                            '${item['quantity']}x ${item['name']}',
                                                            style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white, fontSize: 13),
                                                          ),
                                                          if (item['flavors'] != null)
                                                            Text(
                                                              item['flavors'],
                                                              style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                                                            ),
                                                        ],
                                                      ),
                                                    ),
                                                    Text(
                                                      'R\$ ${_formatCurrency(item['subtotal'])}',
                                                      style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white, fontSize: 13),
                                                    ),
                                                  ],
                                                ),
                                                if (hasNotes)
                                                  Padding(
                                                    padding: const EdgeInsets.only(left: 28, top: 4),
                                                    child: Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                      decoration: BoxDecoration(
                                                        color: Colors.amber.withValues(alpha: 0.15),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          const Icon(Icons.sticky_note_2, size: 11, color: Colors.amber),
                                                          const SizedBox(width: 4),
                                                          Flexible(
                                                            child: Text(
                                                              item['notes'],
                                                              style: const TextStyle(color: Colors.amber, fontSize: 11, fontStyle: FontStyle.italic),
                                                              maxLines: 2,
                                                              overflow: TextOverflow.ellipsis,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
