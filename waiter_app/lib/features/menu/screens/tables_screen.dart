import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../order/screens/order_screen.dart';
import '../../order/screens/table_orders_screen.dart';
import '../../order/screens/comandas_screen.dart';
import '../providers/menu_provider.dart';
import '../models/table_model.dart';
import 'close_table_screen.dart';

class TablesScreen extends StatefulWidget {
  const TablesScreen({super.key});

  @override
  State<TablesScreen> createState() => _TablesScreenState();
}

class _TablesScreenState extends State<TablesScreen> with TickerProviderStateMixin {
  late AnimationController _animationController;
  Timer? _pollTimer;
  final List<int> _notifiedOrderIds = [];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MenuProvider>(context, listen: false).loadData();
      _animationController.forward();
      _startPolling();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  void _startPolling() {
    // Check every 30 seconds
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _checkReadyOrders();
    });
    // Check immediately too
    _checkReadyOrders();
  }

  Future<void> _checkReadyOrders() async {
    if (!mounted) return;
    
    final provider = Provider.of<MenuProvider>(context, listen: false);
    final orders = await provider.getReadyOrders();
    
    if (!mounted) return;


    for (var order in orders) {
      if (!_notifiedOrderIds.contains(order['id'])) {
        _notifiedOrderIds.add(order['id']);
        
        // Show notification
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Pedido #${order['id']} da mesa ${order['table']} está PRONTO! 🍽️'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'OK',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    }
  }



  void _closeTable(TableModel table) {
    Navigator.pop(context); // Close asking modal
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => CloseTableScreen(table: table)),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'available':
      case 'livre':
        return const Color(0xFF4CAF50);
      case 'occupied':
      case 'ocupada':
        return const Color(0xFFFF5252);
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'available':
      case 'livre':
        return 'LIVRE';
      case 'occupied':
      case 'ocupada':
        return 'OCUPADA';
      default:
        return status.toUpperCase();
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'available':
      case 'livre':
        return Icons.check_circle_outline;
      case 'occupied':
      case 'ocupada':
        return Icons.people;
      default:
        return Icons.table_restaurant;
    }
  }

  void _showTableOptions(TableModel table) {
    final isOccupied = table.status.toLowerCase() == 'occupied' || 
                       table.status.toLowerCase() == 'ocupada';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey.shade600,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Table info
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _getStatusColor(table.status).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.table_restaurant,
                    color: _getStatusColor(table.status),
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        table.name,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _getStatusLabel(table.status),
                        style: TextStyle(
                          color: _getStatusColor(table.status),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Actions
            _buildActionButton(
              icon: Icons.add_circle,
              label: 'Novo Pedido',
              subtitle: 'Adicionar itens à mesa',
              color: const Color(0xFF4CAF50),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => OrderScreen(table: table)),
                );
              },
            ),
            
            const SizedBox(height: 12),
            
            _buildActionButton(
              icon: Icons.receipt_long,
              label: 'Ver Pedidos',
              subtitle: isOccupied ? 'Conferir pedidos da mesa' : 'Mesa sem pedidos',
              color: isOccupied ? Colors.blue : Colors.grey,
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => TableOrdersScreen(table: table)),
                );
              },
            ),

            if (isOccupied) ...[
              const SizedBox(height: 12),
              _buildActionButton(
                icon: Icons.check_circle,
                label: 'Fechar Mesa',
                subtitle: 'Liberar mesa e finalizar',
                color: Colors.red,
                onTap: () => _closeTable(table), // Use specific method instead
              ),
            ],
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade500),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient App Bar
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF1E1E1E),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFFF6B35), Color(0xFFFF8F61)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Olá, ${auth.userName ?? 'Garçom'} 👋',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Selecione uma mesa',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              // Comandas button
              Container(
                margin: const EdgeInsets.only(right: 4),
                child: IconButton(
                  icon: const Icon(Icons.receipt_long, color: Colors.white),
                  tooltip: 'Comandas',
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ComandasScreen()),
                    );
                  },
                ),
              ),
              // Refresh button
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white),
                tooltip: 'Atualizar',
                onPressed: () {
                  Provider.of<MenuProvider>(context, listen: false).loadData();
                },
              ),
              // Logout button
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.white),
                tooltip: 'Sair',
                onPressed: () => auth.logout(),
              ),
            ],
          ),
          
          // Tables Grid
          Consumer<MenuProvider>(
            builder: (context, menuProvider, child) {
              if (menuProvider.isLoading) {
                return const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFFFF6B35)),
                  ),
                );
              }

              if (menuProvider.errorMessage != null) {
                return SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
                          const SizedBox(height: 16),
                          Text(
                            'Erro ao carregar dados',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            menuProvider.errorMessage!,
                            style: TextStyle(color: Colors.grey.shade500),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => menuProvider.loadData(),
                            icon: const Icon(Icons.refresh),
                            label: const Text('Tentar novamente'),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }

              if (menuProvider.tables.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.table_restaurant, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('Nenhuma mesa encontrada'),
                      ],
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.1,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final table = menuProvider.tables[index];
                      final statusColor = _getStatusColor(table.status);
                      final isOccupied = table.status.toLowerCase() == 'occupied' ||
                                        table.status.toLowerCase() == 'ocupada';
                      
                      return AnimatedBuilder(
                        animation: _animationController,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: 0.5 + (_animationController.value * 0.5),
                            child: Opacity(
                              opacity: _animationController.value,
                              child: child,
                            ),
                          );
                        },
                        child: _buildTableCard(table, statusColor, isOccupied),
                      );
                    },
                    childCount: menuProvider.tables.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTableCard(TableModel table, Color statusColor, bool isOccupied) {
    return Card(
      elevation: isOccupied ? 8 : 4,
      shadowColor: statusColor.withValues(alpha: 0.4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: statusColor.withValues(alpha: 0.5),
          width: isOccupied ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: () => _showTableOptions(table),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: isOccupied
                ? LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      statusColor.withValues(alpha: 0.15),
                      statusColor.withValues(alpha: 0.05),
                    ],
                  )
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Status indicator
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.table_restaurant,
                  size: 36,
                  color: statusColor,
                ),
              ),
              const SizedBox(height: 12),
              
              // Table name
              Text(
                table.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(table.status),
                      size: 14,
                      color: statusColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _getStatusLabel(table.status),
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
