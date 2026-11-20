import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../menu/providers/menu_provider.dart';
import '../../menu/models/product_model.dart';
import '../providers/order_provider.dart';

class ProductTab extends StatefulWidget {
  const ProductTab({super.key});

  @override
  State<ProductTab> createState() => _ProductTabState();
}

class _ProductTabState extends State<ProductTab> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  void _addToCart(ProductModel product) {
    final TextEditingController notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(product.name),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Deseja adicionar alguma observação?'),
              const SizedBox(height: 16),
              TextField(
                controller: notesController,
                decoration: InputDecoration(
                  labelText: 'Observação (Opcional)',
                  border: OutlineInputBorder(),
                  hintText: 'Ex: Sem gelo, Com limão...',
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                Provider.of<OrderProvider>(context, listen: false).addProduct(
                  product,
                  notes: notesController.text.isNotEmpty ? notesController.text : null,
                );
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${product.name} adicionado ao carrinho!'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
              child: const Text('Adicionar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final menuProvider = Provider.of<MenuProvider>(context);
    final products = menuProvider.products;

    if (products.isEmpty) {
      return const Center(child: Text('Nenhum produto disponível.'));
    }

    // Group products by category if needed, or just list them.
    // For now, let's just list them nicely.
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: CircleAvatar(
              backgroundColor: Colors.deepOrange.shade100,
              child: Icon(
                _getCategoryIcon(product.category),
                color: Colors.deepOrange,
              ),
            ),
            title: Text(
              product.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'R\$ ${product.price.toStringAsFixed(2)}',
              style: TextStyle(color: Colors.grey.shade700),
            ),
            trailing: IconButton(
              icon: const Icon(Icons.add_circle, color: Colors.green, size: 32),
              onPressed: () => _addToCart(product),
            ),
          ),
        );
      },
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'bebidas':
      case 'drink':
      case 'drinks':
        return Icons.local_drink;
      case 'sobremesa':
      case 'dessert':
        return Icons.cake;
      default:
        return Icons.fastfood;
    }
  }
}
