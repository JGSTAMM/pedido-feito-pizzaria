import 'package:flutter/material.dart';

/// Categorias do cardápio digital.
/// Mapeiam para o campo `category` da tabela `products` no Laravel.
enum MenuCategory {
  pizzas,
  drinks,
  extras,
}

extension MenuCategoryLabel on MenuCategory {
  String get label {
    switch (this) {
      case MenuCategory.pizzas:
        return 'Pizzas';
      case MenuCategory.drinks:
        return 'Bebidas';
      case MenuCategory.extras:
        return 'Extras';
    }
  }

  IconData get icon {
    switch (this) {
      case MenuCategory.pizzas:
        return Icons.local_pizza;
      case MenuCategory.drinks:
        return Icons.local_drink;
      case MenuCategory.extras:
        return Icons.restaurant;
    }
  }

  /// Mapeia string do banco para enum
  static MenuCategory fromString(String category) {
    switch (category.toLowerCase()) {
      case 'pizza':
      case 'pizzas':
        return MenuCategory.pizzas;
      case 'bebida':
      case 'bebidas':
      case 'drink':
      case 'drinks':
        return MenuCategory.drinks;
      default:
        return MenuCategory.extras;
    }
  }
}

/// Modelo de item genérico do cardápio (produto ou referência a pizza).
class MenuItemModel {
  final int id;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final MenuCategory category;
  final bool isPizza;
  final Color? accentColor;

  const MenuItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    required this.category,
    this.isPizza = false,
    this.accentColor,
  });

  /// Cria a partir do JSON da API (tabela `products`)
  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    final cat = MenuCategoryLabel.fromString(json['category'] ?? 'extras');
    return MenuItemModel(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      imageUrl: json['image_url'] as String?,
      category: cat,
      isPizza: false, // Produtos da tabela nunca são pizza
    );
  }
}

/// Modelo de sabor de pizza (tabela `pizza_flavors`)
class PizzaFlavorApiModel {
  final int id;
  final String name;
  final String? description;
  final double basePrice;

  const PizzaFlavorApiModel({
    required this.id,
    required this.name,
    this.description,
    required this.basePrice,
  });

  factory PizzaFlavorApiModel.fromJson(Map<String, dynamic> json) {
    return PizzaFlavorApiModel(
      id: json['id'] as int,
      name: json['name'] as String,
      description: json['description'] as String?,
      basePrice: double.tryParse(json['base_price'].toString()) ?? 0.0,
    );
  }
}

/// Modelo de tamanho de pizza (tabela `pizza_sizes`)
class PizzaSizeApiModel {
  final int id;
  final String name;
  final int slices;
  final int maxFlavors;
  final bool isSpecialBrotoRule;

  const PizzaSizeApiModel({
    required this.id,
    required this.name,
    required this.slices,
    required this.maxFlavors,
    required this.isSpecialBrotoRule,
  });

  factory PizzaSizeApiModel.fromJson(Map<String, dynamic> json) {
    return PizzaSizeApiModel(
      id: json['id'] as int,
      name: json['name'] as String,
      slices: json['slices'] as int,
      maxFlavors: json['max_flavors'] as int,
      isSpecialBrotoRule: json['is_special_broto_rule'] == true || json['is_special_broto_rule'] == 1,
    );
  }
}

/// Modelo de bairro com taxa de entrega (tabela `neighborhoods`)
class NeighborhoodModel {
  final int id;
  final String name;
  final double deliveryFee;

  const NeighborhoodModel({
    required this.id,
    required this.name,
    required this.deliveryFee,
  });

  factory NeighborhoodModel.fromJson(Map<String, dynamic> json) {
    return NeighborhoodModel(
      id: json['id'] as int,
      name: json['name'] as String,
      deliveryFee: double.tryParse(json['delivery_fee'].toString()) ?? 0.0,
    );
  }
}
