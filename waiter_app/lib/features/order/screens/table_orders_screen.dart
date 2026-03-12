import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../menu/models/table_model.dart';

class TableOrdersScreen extends StatefulWidget {
  final TableModel table;

  const TableOrdersScreen({super.key, required this.table});

  @override
  State<TableOrdersScreen> createState() => _TableOrdersScreenState();
}

class _TableOrdersScreenState extends State<TableOrdersScreen> {
  final ApiService _apiService = ApiService();
  bool isLoading = true;
  String? error;
  List<dynamic> orders = [];
  double totalTable = 0;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  // Helper to safely parse numbers (handles both string and numeric)
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

  Future<void> _loadOrders() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      final response = await _apiService.dio.get('/tables/${widget.table.id}/orders');

      if (response.statusCode == 200) {
        final data = response.data;
        setState(() {
          orders = data['orders'] ?? [];
          totalTable = _parseDouble(data['total_table']);
          isLoading = false;
        });
      } else {
        setState(() {
          error = 'Erro ao carregar pedidos';
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
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'delivered':
        return 'Entregue';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Pedidos - ${widget.table.name}'),
        backgroundColor: Colors.deepOrange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
          ),
        ],
      ),
      body: isLoading
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
              : orders.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text(
                            'Nenhum pedido ativo',
                            style: TextStyle(fontSize: 18, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        // Total da mesa
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          color: const Color(0xFF2A1A0A),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total da Mesa:',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white70,
                                ),
                              ),
                              Text(
                                'R\$ ${_formatCurrency(totalTable)}',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.deepOrange,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Lista de pedidos
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: orders.length,
                            itemBuilder: (context, index) {
                              final order = orders[index];
                              final items = order['items'] as List;
                              
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: 2,
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
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                'Pedido #${order['id']}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                order['created_at'] ?? '',
                                                style: TextStyle(
                                                  color: Colors.grey.shade400,
                                                ),
                                              ),
                                            ],
                                          ),
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
                                        return ListTile(
                                          leading: Icon(
                                            item['type'] == 'pizza' 
                                                ? Icons.local_pizza 
                                                : Icons.fastfood,
                                            color: item['type'] == 'pizza' 
                                                ? Colors.orange 
                                                : Colors.green,
                                          ),
                                          title: Text(
                                            '${item['quantity']}x ${item['name']}',
                                            style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white),
                                          ),
                                          subtitle: item['flavors'] != null
                                              ? Text(
                                                  item['flavors'],
                                                  style: TextStyle(color: Colors.grey.shade400),
                                                )
                                              : null,
                                          trailing: Text(
                                            'R\$ ${_formatCurrency(item['subtotal'])}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                        );
                                      },
                                    ),
                                    // Total do pedido
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1E1E1E),
                                        borderRadius: const BorderRadius.only(
                                          bottomLeft: Radius.circular(12),
                                          bottomRight: Radius.circular(12),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          const Text('Subtotal: ', style: TextStyle(color: Colors.grey)),
                                          Text(
                                            'R\$ ${_formatCurrency(order['total_amount'])}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                              color: Colors.deepOrange,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
    );
  }
}
