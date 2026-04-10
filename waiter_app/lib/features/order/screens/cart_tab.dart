import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';

class CartTab extends StatelessWidget {
  final String tableId;
  final VoidCallback onSuccess;

  const CartTab({
    super.key,
    required this.tableId,
    required this.onSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<OrderProvider>(
      builder: (context, order, child) {
        if (order.cartItems.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('O carrinho está vazio', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: order.cartItems.length,
                itemBuilder: (context, index) {
                  final item = order.cartItems[index];
                  final hasNotes = item.notes != null && item.notes!.isNotEmpty;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    color: const Color(0xFF2A2A2A),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Icon
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.deepOrange.withValues(alpha: 0.2),
                            child: Icon(
                              item.type == 'pizza' ? Icons.local_pizza : Icons.fastfood,
                              color: Colors.deepOrange,
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                                if (item.type == 'pizza' && item.flavors != null)
                                  Text(
                                    item.flavors!.map((f) => f.name).join(' + '),
                                    style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                if (hasNotes) ...[
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.sticky_note_2, size: 12, color: Colors.amber),
                                        const SizedBox(width: 4),
                                        Flexible(
                                          child: Text(
                                            item.notes!,
                                            style: const TextStyle(
                                              color: Colors.amber,
                                              fontSize: 11,
                                              fontStyle: FontStyle.italic,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 2),
                                Text(
                                  'R\$ ${item.estimatedPrice.toStringAsFixed(2).replaceAll('.', ',')}',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Delete
                          GestureDetector(
                            onTap: () => order.removeItem(item.id),
                            child: const Padding(
                              padding: EdgeInsets.only(left: 8),
                              child: Icon(Icons.delete_outline, color: Colors.redAccent, size: 22),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            // Bottom bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                border: Border(top: BorderSide(color: Colors.grey.shade800)),
              ),
              child: SafeArea(
                child: FilledButton(
                  onPressed: order.isSending
                      ? null
                      : () async {
                          final success = await order.sendOrder(tableId);
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Pedido enviado com sucesso!'),
                                backgroundColor: Colors.green,
                              ),
                            );
                            onSuccess();
                          } else if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Erro ao enviar pedido'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: order.isSending
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check),
                            SizedBox(width: 8),
                            Text('ENVIAR PEDIDO'),
                          ],
                        ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
