import 'package:flutter/material.dart';
import '../../menu/models/pizza_size_model.dart';

class PizzaSizeSelector extends StatelessWidget {
  final List<PizzaSizeModel> sizes;
  final PizzaSizeModel? selectedSize;
  final ValueChanged<PizzaSizeModel> onSelected;

  const PizzaSizeSelector({
    super.key,
    required this.sizes,
    required this.selectedSize,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: sizes.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final size = sizes[index];
          final isSelected = size.id == selectedSize?.id;

          return ChoiceChip(
            label: Text(
              '${size.name}\n(${size.slices} fat.)',
              textAlign: TextAlign.center,
            ),
            selected: isSelected,
            onSelected: (_) => onSelected(size),
            selectedColor: Colors.deepOrange.shade100,
            labelStyle: TextStyle(
              color: isSelected ? Colors.deepOrange : Colors.black87,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          );
        },
      ),
    );
  }
}
