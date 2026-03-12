
import 'package:flutter/material.dart';
import '../../domain/models/flavor_model.dart';

class MockPizzaRepository {
  Future<List<FlavorModel>> getFlavors() async {
    // Simulando delay de rede
    await Future.delayed(const Duration(milliseconds: 500));

    return const [
      FlavorModel(
        id: '1',
        name: 'Calabresa',
        priceLarge: 50.0,
        imageAsset: 'assets/images/calabresa.png', // Placeholder
        color: Colors.redAccent,
        ingredients: ['Molho de tomate', 'Mussarela', 'Calabresa', 'Cebola', 'Orégano'],
      ),
      FlavorModel(
        id: '2',
        name: 'Camarão',
        priceLarge: 90.0,
        imageAsset: 'assets/images/camarao.png', // Placeholder
        color: Colors.orangeAccent,
        ingredients: ['Molho de tomate', 'Mussarela', 'Camarão', 'Catupiry', 'Orégano'],
      ),
      FlavorModel(
        id: '3',
        name: 'Marguerita',
        priceLarge: 60.0,
        imageAsset: 'assets/images/marguerita.png', // Placeholder
        color: Colors.green,
        ingredients: ['Molho de tomate', 'Mussarela', 'Tomate', 'Manjericão'],
      ),
      FlavorModel(
        id: '4',
        name: 'Quatro Queijos',
        priceLarge: 70.0,
        imageAsset: 'assets/images/4queijos.png', // Placeholder
        color: Colors.yellow,
        ingredients: ['Molho de tomate', 'Mussarela', 'Provolone', 'Parmesão', 'Gorgonzola'],
      ),
      FlavorModel(
        id: '5',
        name: 'Portuguesa',
        priceLarge: 55.0,
        imageAsset: 'assets/images/portuguesa.png', // Placeholder
        color: Colors.red,
        ingredients: ['Molho de tomate', 'Mussarela', 'Presunto', 'Ovo', 'Cebola', 'Ervilha'],
      ),
    ];
  }
}
