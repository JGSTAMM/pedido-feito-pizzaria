
import 'package:equatable/equatable.dart';
import 'flavor_model.dart';

enum PizzaSize { large, broto }

class PizzaModel extends Equatable {
  final PizzaSize size;
  final int splitCount; // 1, 2, or 3. Relevant mostly for Large.
  final Map<int, FlavorModel?> selectedFlavors; // Index 0, 1, 2 map to slices

  const PizzaModel({
    this.size = PizzaSize.large,
    this.splitCount = 1,
    this.selectedFlavors = const {},
  });

  PizzaModel copyWith({
    PizzaSize? size,
    int? splitCount,
    Map<int, FlavorModel?>? selectedFlavors,
  }) {
    return PizzaModel(
      size: size ?? this.size,
      splitCount: splitCount ?? this.splitCount,
      selectedFlavors: selectedFlavors ?? this.selectedFlavors,
    );
  }

  // Regra de Negócio: Quantas fatias a pizza tem atualmente
  int get activeSlices {
    return size == PizzaSize.broto ? 1 : splitCount;
  }

  // Regra de Negócio: Preço Final
  double calculateTotalPrice() {
    if (selectedFlavors.isEmpty) return 0.0;

    // Filtra apenas os sabores selecionados (não nulos) dentro dos slices ativos
    final validFlavors = <FlavorModel>[];
    for (int i = 0; i < activeSlices; i++) {
        if (selectedFlavors[i] != null) {
            validFlavors.add(selectedFlavors[i]!);
        }
    }

    if (validFlavors.isEmpty) return 0.0;

    double finalPrice = 0.0;

    if (size == PizzaSize.broto) {
      // Regra Broto: (Preço Grande / 2) + 5
      // Como broto só tem 1 sabor, pega o preço desse sabor
      // Se tiver selecionado sabor na fatia 0
      if (validFlavors.isNotEmpty) {
          final flavor = validFlavors.first;
          finalPrice = (flavor.priceLarge / 2) + 5;
      }
    } else {
      // Regra Pizza Grande (Inteira, Meia-Meia ou 3 Sabores)
      // O preço é baseado no SABOR DE MAIOR VALOR
      
      double maxFlavorPrice = 0.0;
      for (var flavor in validFlavors) {
        if (flavor.priceLarge > maxFlavorPrice) {
          maxFlavorPrice = flavor.priceLarge;
        }
      }
      finalPrice = maxFlavorPrice;
    }

    return finalPrice;
  }

  @override
  List<Object?> get props => [size, splitCount, selectedFlavors];
}
