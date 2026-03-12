
import 'package:flutter_test/flutter_test.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/flavor_model.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/pizza_model.dart';
import 'package:flutter/material.dart';

void main() {
  const flavorA = FlavorModel(id: '1', name: 'A', priceLarge: 50, color: Colors.red);
  const flavorB = FlavorModel(id: '2', name: 'B', priceLarge: 90, color: Colors.blue);
  const flavorC = FlavorModel(id: '3', name: 'C', priceLarge: 60, color: Colors.green);

  group('Pizza Pricing Logic', () {
    test('Meia-Meia uses MAX value', () {
      const pizza = PizzaModel(
        size: PizzaSize.large,
        splitCount: 2,
        selectedFlavors: {0: flavorA, 1: flavorB},
      );
      
      expect(pizza.calculateTotalPrice(), 90.0);
    });

    test('3 Flavors uses MAX value', () {
      const pizza = PizzaModel(
        size: PizzaSize.large,
        splitCount: 3,
        selectedFlavors: {0: flavorA, 1: flavorB, 2: flavorC},
      );
      
      expect(pizza.calculateTotalPrice(), 90.0);
    });

    test('Broto calculates correctly', () {
      // Broto de C (60) -> (60/2) + 5 = 35
      const pizza = PizzaModel(
        size: PizzaSize.broto,
        splitCount: 1,
        selectedFlavors: {0: flavorC},
      );
      
      expect(pizza.calculateTotalPrice(), 35.0);
    });
    
    test('Empty pizza costs 0', () {
        const pizza = PizzaModel();
        expect(pizza.calculateTotalPrice(), 0.0); 
    });
    
    test('Partial selection ignores missing slices', () {
         const pizza = PizzaModel(
            size: PizzaSize.large,
            splitCount: 2,
            selectedFlavors: {0: flavorA}, // Slice 1 is empty
         );
         expect(pizza.calculateTotalPrice(), 50.0);
    });
  });
}
