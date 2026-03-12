
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/pizza_model.dart';
import 'package:waiter_app/features/cart/domain/models/cart_item_model.dart';
import 'package:waiter_app/features/pizza_builder/presentation/providers/pizza_builder_notifier.dart';
import 'package:waiter_app/features/cart/presentation/providers/cart_notifier.dart';
import '../widgets/pizza_visualizer.dart';
import '../widgets/flavor_selection_modal.dart';

class PizzaBuilderScreen extends ConsumerWidget {
  const PizzaBuilderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pizzaState = ref.watch(pizzaBuilderProvider);
    final notifier = ref.read(pizzaBuilderProvider.notifier);
    final t = ref.watch(translationsProvider);
    
    final totalPrice = pizzaState.calculateTotalPrice();

    return Scaffold(
      appBar: AppBar(
        title: Text(t['builder_title']!),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.shopping_cart),
                if (ref.watch(cartProvider).items.isNotEmpty)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Text(
                        '${ref.watch(cartProvider).items.fold<int>(0, (s, i) => s + i.quantity)}',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () => context.push('/checkout'),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => notifier.clear(),
          )
        ],
      ),
      body: Column(
        children: [
          // Size Selector
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SegmentedButton<PizzaSize>(
              segments: [
                ButtonSegment(value: PizzaSize.broto, label: Text(t['builder_broto']!), icon: const Icon(Icons.circle, size: 10)),
                ButtonSegment(value: PizzaSize.large, label: Text(t['builder_grande']!), icon: const Icon(Icons.circle, size: 20)),
              ],
              selected: {pizzaState.size},
              onSelectionChanged: (newSelection) {
                notifier.setSize(newSelection.first);
              },
            ),
          ),
          
          // Split Selector (Only for Large)
          if (pizzaState.size == PizzaSize.large)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(t['builder_flavors']!),
                  const SizedBox(width: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _SplitButton(count: 1, currentCount: pizzaState.splitCount, onTap: notifier.setSplitCount),
                      _SplitButton(count: 2, currentCount: pizzaState.splitCount, onTap: notifier.setSplitCount),
                      _SplitButton(count: 3, currentCount: pizzaState.splitCount, onTap: notifier.setSplitCount),
                    ],
                  ),
                ],
              ),
            ),
            
          const SizedBox(height: 20),
          
          // Visualizer
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Center(
                child: PizzaVisualizer(
                  pizza: pizzaState,
                  emptySliceText: t['flavor_tap_choose']!,
                  onSliceTap: (sliceIndex) {
                    showModalBottomSheet(
                      context: context,
                      builder: (context) => FlavorSelectionModal(
                        pizzaSize: pizzaState.size,
                        onFlavorSelected: (flavor) {
                            notifier.selectFlavor(sliceIndex, flavor);
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
          
          // Price Footer
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5)),
              ],
            ),
            child: SafeArea(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Text(t['builder_final_price']!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                       Text(
                         "R\$ ${totalPrice.toStringAsFixed(2)}", 
                         style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green),
                       ),
                     ],
                   ),
                   ElevatedButton(
                     onPressed: totalPrice > 0 ? () {
                       final cartItem = CartItemModel(
                         id: DateTime.now().millisecondsSinceEpoch.toString(),
                         pizza: pizzaState,
                         quantity: 1,
                       );
                       
                       ref.read(cartProvider.notifier).addItem(cartItem);
                       
                        _showAddedToast(context, t['builder_added']!, t['builder_go_cart']!);
                       notifier.clear();
                     } : null,
                     style: ElevatedButton.styleFrom(
                       padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                       backgroundColor: Colors.orange,
                       foregroundColor: Colors.white,
                     ),
                     child: Text(t['builder_add']!),
                   )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

void _showAddedToast(BuildContext context, String message, String actionLabel) {
  final overlay = Overlay.of(context);
  late OverlayEntry entry;

  entry = OverlayEntry(
    builder: (context) => _AutoDismissToast(
      message: message,
      actionLabel: actionLabel,
      onAction: () {
        entry.remove();
        GoRouter.of(context).push('/checkout');
      },
      onDismiss: () => entry.remove(),
    ),
  );

  overlay.insert(entry);

  Timer(const Duration(seconds: 3), () {
    try {
      entry.remove();
    } catch (_) {}
  });
}

class _AutoDismissToast extends StatefulWidget {
  final String message;
  final String actionLabel;
  final VoidCallback onAction;
  final VoidCallback onDismiss;

  const _AutoDismissToast({
    required this.message,
    required this.actionLabel,
    required this.onAction,
    required this.onDismiss,
  });

  @override
  State<_AutoDismissToast> createState() => _AutoDismissToastState();
}

class _AutoDismissToastState extends State<_AutoDismissToast>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();

    // Start fade out at 2.5s
    Timer(const Duration(milliseconds: 2500), () {
      if (mounted) _controller.reverse();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: MediaQuery.of(context).padding.bottom + 16,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF333333),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF66BB6A), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.message,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: widget.onAction,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.orange,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    child: Text(
                      widget.actionLabel,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SplitButton extends StatelessWidget {
  final int count;
  final int currentCount;
  final Function(int) onTap;

  const _SplitButton({required this.count, required this.currentCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    bool isSelected = count == currentCount;
    return InkWell(
      onTap: () => onTap(count),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange : Colors.grey[200],
          borderRadius: BorderRadius.circular(20),
          border: isSelected ? Border.all(color: Colors.orange) : null,
        ),
        child: Text(
          "$count", 
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
