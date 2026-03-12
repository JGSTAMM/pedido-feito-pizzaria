
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/pizza_model.dart';
import '../../domain/models/flavor_model.dart';

class PizzaBuilderNotifier extends Notifier<PizzaModel> {
  @override
  PizzaModel build() {
    return const PizzaModel();
  }

  void setSize(PizzaSize size) {
    if (state.size == size) return;
    
    // Se mudar para broto, reseta splitCount para 1 (visualmente) ou lógica interna
    // O Model usa `activeSlices` para determinar.
    // Mas se voltar para Grande, deve voltar para o splitCount anterior? 
    // Por simplicidade, ao mudar de tamanho, resetamos para 1 sabor se for broto.
    
    int newSplitCount = state.splitCount;
    if (size == PizzaSize.broto) {
      newSplitCount = 1;
    }

    state = state.copyWith(size: size, splitCount: newSplitCount);
  }

  void setSplitCount(int count) {
    if (count < 1 || count > 3) return;
    if (state.size == PizzaSize.broto && count > 1) return; // Broto só aceita 1

    state = state.copyWith(splitCount: count);
  }

  void selectFlavor(int sliceIndex, FlavorModel flavor) {
    if (sliceIndex >= state.activeSlices) return; // Proteção

    final Map<int, FlavorModel?> newFlavors = Map.from(state.selectedFlavors);
    newFlavors[sliceIndex] = flavor;
    state = state.copyWith(selectedFlavors: newFlavors);
  }

  void removeFlavor(int sliceIndex) {
    final Map<int, FlavorModel?> newFlavors = Map.from(state.selectedFlavors);
    newFlavors.remove(sliceIndex);
    state = state.copyWith(selectedFlavors: newFlavors);
  }
  
  void clear() {
    state = const PizzaModel();
  }
}

final pizzaBuilderProvider = NotifierProvider<PizzaBuilderNotifier, PizzaModel>(PizzaBuilderNotifier.new);
