import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:waiter_app/features/cart/domain/models/cart_item_model.dart';
import 'package:waiter_app/features/cart/presentation/providers/cart_notifier.dart';
import 'package:waiter_app/features/digital_menu/domain/models/menu_item_model.dart';
import 'package:waiter_app/core/l10n/content_translations.dart';

class DrinkAddModal extends ConsumerStatefulWidget {
  final MenuItemModel item;

  const DrinkAddModal({super.key, required this.item});

  @override
  ConsumerState<DrinkAddModal> createState() => _DrinkAddModalState();
}

class _DrinkAddModalState extends ConsumerState<DrinkAddModal> {
  int _quantity = 1;
  String? _observation;

  @override
  Widget build(BuildContext context) {
    final tr = ref.watch(contentTranslatorProvider);
    final totalPrice = widget.item.price * _quantity;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Item info
          Row(
            children: [
              // Icon/Color circle
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: (widget.item.accentColor ?? Colors.grey).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.local_drink,
                  color: widget.item.accentColor ?? Colors.grey,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr(widget.item.name),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    if (widget.item.description != null)
                      Text(
                        widget.item.description!,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Quantity Selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: _quantity > 1
                      ? () => setState(() => _quantity--)
                      : null,
                  icon: const Icon(Icons.remove_circle_outline),
                  color: const Color(0xFFFF6B35),
                  iconSize: 28,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    '$_quantity',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D2D2D),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: _quantity < 20
                      ? () => setState(() => _quantity++)
                      : null,
                  icon: const Icon(Icons.add_circle_outline),
                  color: const Color(0xFFFF6B35),
                  iconSize: 28,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Observation input
          TextField(
            maxLines: 1,
            decoration: InputDecoration(
              hintText: 'Observação (opcional)',
              prefixIcon: const Icon(Icons.notes, size: 20),
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            onChanged: (value) => _observation = value,
          ),

          const SizedBox(height: 24),

          // Add button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                final cartItem = CartItemModel(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  menuItem: widget.item,
                  quantity: _quantity,
                  observation: _observation,
                );
                ref.read(cartProvider.notifier).addItem(cartItem);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).clearSnackBars();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${tr(widget.item.name)} adicionado ao carrinho!'),
                    backgroundColor: const Color(0xFF333333),
                    duration: const Duration(seconds: 3),
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    margin: const EdgeInsets.all(12),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6B35),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ADICIONAR',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    'R\$ ${totalPrice.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}
