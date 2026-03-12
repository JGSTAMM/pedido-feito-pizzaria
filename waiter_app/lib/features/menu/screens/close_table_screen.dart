import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';
import '../../menu/models/table_model.dart';
import '../providers/menu_provider.dart';

class CloseTableScreen extends StatefulWidget {
  final TableModel table;

  const CloseTableScreen({super.key, required this.table});

  @override
  State<CloseTableScreen> createState() => _CloseTableScreenState();
}

class _CloseTableScreenState extends State<CloseTableScreen> {
  bool _isLoading = true;
  List<dynamic> _orders = [];
  double _totalAmount = 0.0;
  
  // Payment State
  String _selectedPaymentMethod = 'dinheiro';
  final TextEditingController _amountController = TextEditingController();
  final ApiService _apiService = ApiService();
  
  // Split payments list
  final List<Map<String, dynamic>> _addedPayments = [];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      final response = await _apiService.dio.get('/tables/${widget.table.id}/orders');
      if (mounted) {
        setState(() {
          _orders = response.data['orders'] ?? [];
          _totalAmount = (response.data['total_table'] ?? 0).toDouble();
          _isLoading = false;
          _updateRemainingAmount();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao carregar pedidos: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  double get _totalPaid {
    return _addedPayments.fold(0.0, (sum, item) => sum + (item['amount'] as double));
  }

  double get _remainingAmount {
    double remaining = _totalAmount - _totalPaid;
    return remaining > 0 ? remaining : 0.0;
  }
  
  double get _currentInputAmount {
    return double.tryParse(_amountController.text.replaceAll(',', '.')) ?? 0.0;
  }

  double get _change {
    // Change only if we have cash payment involved or just total paid > total amount?
    // Usually change is relevant when Total Paid > Total Amount.
    double paid = _totalPaid; // Calculated from added payments
    return paid > _totalAmount ? paid - _totalAmount : 0.0;
  }
  
  void _updateRemainingAmount() {
    _amountController.text = _remainingAmount.toStringAsFixed(2);
  }

  void _addPayment() {
    double amount = _currentInputAmount;
    
    if (amount <= 0.01) {
       ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Digite um valor válido'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() {
      _addedPayments.add({
        'method': _selectedPaymentMethod,
        'amount': amount,
        'label': _getPaymentLabel(_selectedPaymentMethod),
        'icon': _getPaymentIcon(_selectedPaymentMethod),
      });
      
      // Auto-update input for next payment if any remaining
      Future.delayed(Duration.zero, () {
         _updateRemainingAmount();
         setState(() {}); 
      });
    });
  }

  void _removePayment(int index) {
    setState(() {
      _addedPayments.removeAt(index);
      _updateRemainingAmount();
    });
  }

  Future<void> _processPayment() async {
    if (_totalPaid < _totalAmount - 0.01) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pagamento incompleto!'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Prepare payments for API
      final paymentsToSend = _addedPayments.map((p) => {
        'method': p['method'],
        'amount': p['amount'], 
      }).toList();

      await Provider.of<MenuProvider>(context, listen: false).payAndCloseTable(widget.table.id, paymentsToSend);

      if (mounted) {
        Navigator.pop(context); // Close screen
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mesa fechada com sucesso!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao processar pagamento: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }
  
  String _getPaymentLabel(String method) {
    switch (method) {
      case 'dinheiro': return 'Dinheiro';
      case 'pix': return 'PIX';
      case 'credito': return 'Crédito';
      case 'debito': return 'Débito';
      default: return method;
    }
  }

  IconData _getPaymentIcon(String method) {
     switch (method) {
      case 'dinheiro': return Icons.attach_money;
      case 'pix': return Icons.qr_code;
      case 'credito': return Icons.credit_card;
      case 'debito': return Icons.credit_card_outlined;
      default: return Icons.payment;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Fechar Mesa ${widget.table.name}'),
        backgroundColor: const Color(0xFF1E1E1E),
        foregroundColor: Colors.white,
      ),
      backgroundColor: const Color(0xFF121212),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      return Card(
                        color: const Color(0xFF1E1E1E),
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ExpansionTile(
                          title: Text(
                            'Pedido #${order['id']}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            'R\$ ${double.parse(order['total_amount'].toString()).toStringAsFixed(2)} - ${order['created_at']}',
                            style: TextStyle(color: Colors.grey[400]),
                          ),
                          children: [
                            for (var item in order['items'])
                              ListTile(
                                title: Text(
                                  item['name'],
                                  style: const TextStyle(color: Colors.white70),
                                ),
                                subtitle: item['flavors'] != null 
                                  ? Text(item['flavors'], style: TextStyle(color: Colors.grey[500], fontSize: 12))
                                  : null,
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${item['quantity']}x',
                                      style: const TextStyle(color: Colors.white70),
                                    ),
                                    Text(
                                      'R\$ ${double.parse(item['subtotal'].toString()).toStringAsFixed(2)}',
                                      style: const TextStyle(color: Colors.greenAccent, fontSize: 12),
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
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    boxShadow: [BoxShadow(blurRadius: 10, color: Colors.black54)],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Totals Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Mesa:', style: TextStyle(color: Colors.white, fontSize: 16)),
                          Text(
                            'R\$ ${_totalAmount.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Pago:', style: TextStyle(color: Colors.grey, fontSize: 16)),
                          Text(
                            'R\$ ${_totalPaid.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.green, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                       const SizedBox(height: 5),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Restante:', style: TextStyle(color: Colors.grey, fontSize: 16)),
                          Text(
                            'R\$ ${_remainingAmount.toStringAsFixed(2)}',
                            style: const TextStyle(color: Colors.redAccent, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const Divider(color: Colors.grey),
                      
                      // Added Payments List
                      if (_addedPayments.isNotEmpty)
                        Container(
                          height: 100,
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListView.builder(
                            itemCount: _addedPayments.length,
                            itemBuilder: (context, index) {
                              final p = _addedPayments[index];
                              return ListTile(
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(p['icon'], color: Colors.white70, size: 20),
                                title: Text(p['label'], style: const TextStyle(color: Colors.white)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('R\$ ${(p['amount'] as double).toStringAsFixed(2)}', style: const TextStyle(color: Colors.white)),
                                    IconButton(
                                      icon: const Icon(Icons.close, color: Colors.red, size: 18),
                                      onPressed: () => _removePayment(index),
                                    )
                                  ],
                                ),
                              );
                            },
                          ),
                        ),

                      // Input Section (Hide if fully paid, unless we want to show change)
                      if (_remainingAmount > 0.01) ...[
                        const Text('Adicionar Pagamento', style: TextStyle(color: Colors.grey)),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _paymentOption('Dinheiro', 'dinheiro', Icons.attach_money),
                              _paymentOption('PIX', 'pix', Icons.qr_code),
                              _paymentOption('Crédito', 'credito', Icons.credit_card),
                              _paymentOption('Débito', 'debito', Icons.credit_card_outlined),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _amountController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                style: const TextStyle(color: Colors.white, fontSize: 20),
                                decoration: const InputDecoration(
                                  prefixText: 'R\$ ',
                                  prefixStyle: TextStyle(color: Colors.white, fontSize: 20),
                                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFFEF4444))),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white24,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: _addPayment,
                              child: const Icon(Icons.add, color: Colors.white),
                            ),
                          ],
                        ),
                      ],

                       if (_change > 0)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Troco:', style: TextStyle(color: Colors.orange, fontSize: 16)),
                              Text(
                                'R\$ ${_change.toStringAsFixed(2)}',
                                style: const TextStyle(color: Colors.orange, fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _remainingAmount <= 0.01 ? const Color(0xFFEF4444) : Colors.grey,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _remainingAmount <= 0.01 ? _processPayment : null,
                        child: const Text('Confirmar Pagamento e Fechar', style: TextStyle(fontSize: 16, color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _paymentOption(String label, String value, IconData icon) {
    bool isSelected = _selectedPaymentMethod == value;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedPaymentMethod = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFEF4444) : const Color(0xFF2C2C2C),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? const Color(0xFFEF4444) : Colors.transparent),
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
