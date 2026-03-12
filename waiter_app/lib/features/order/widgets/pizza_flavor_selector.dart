import 'package:flutter/material.dart';
import '../../menu/models/pizza_flavor_model.dart';

class PizzaFlavorSelector extends StatelessWidget {
  final List<PizzaFlavorModel> flavors;
  final List<PizzaFlavorModel> selectedFlavors;
  final ValueChanged<PizzaFlavorModel> onToggle;
  final int maxFlavors;

  const PizzaFlavorSelector({
    super.key,
    required this.flavors,
    required this.selectedFlavors,
    required this.onToggle,
    required this.maxFlavors,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 2.5,
      ),
      itemCount: flavors.length,
      itemBuilder: (context, index) {
        final flavor = flavors[index];
        final isSelected = selectedFlavors.any((f) => f.id == flavor.id);
        // Disable if max reached and not already selected
        final isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;

        return InkWell(
          onTap: isDisabled ? null : () => onToggle(flavor),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? Colors.deepOrange.shade50 : Colors.white,
              border: Border.all(
                color: isSelected ? Colors.deepOrange : Colors.grey.shade300,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        flavor.name,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.deepOrange : Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'R\$ ${flavor.basePrice.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle, color: Colors.deepOrange, size: 20),
              ],
            ),
          ),
        );
      },
    );
  }
}
