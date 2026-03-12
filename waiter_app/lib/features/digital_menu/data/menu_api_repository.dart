import 'package:dio/dio.dart';
import 'package:waiter_app/core/constants/api_constants.dart';
import 'package:waiter_app/features/digital_menu/domain/models/menu_item_model.dart';

/// Dados completos do cardápio retornados pela API.
class DigitalMenuData {
  final List<PizzaSizeApiModel> pizzaSizes;
  final List<PizzaFlavorApiModel> pizzaFlavors;
  final List<MenuItemModel> products;
  final List<NeighborhoodModel> neighborhoods;

  const DigitalMenuData({
    required this.pizzaSizes,
    required this.pizzaFlavors,
    required this.products,
    required this.neighborhoods,
  });

  /// Retorna produtos filtrados por categoria
  List<MenuItemModel> getProductsByCategory(MenuCategory category) {
    return products.where((p) => p.category == category).toList();
  }

  /// Retorna todas as categorias que têm pelo menos 1 produto
  List<MenuCategory> get activeCategories {
    final cats = <MenuCategory>{};
    // Pizzas sempre primeiro se tiver sabores
    if (pizzaFlavors.isNotEmpty) cats.add(MenuCategory.pizzas);
    for (final p in products) {
      cats.add(p.category);
    }
    return cats.toList();
  }
}

/// Repository que busca dados do cardápio digital da API real do Laravel.
class MenuApiRepository {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  Future<DigitalMenuData> fetchMenu() async {
    final response = await _dio.get('/digital-menu');
    final data = response.data;

    return DigitalMenuData(
      pizzaSizes: (data['pizza_sizes'] as List)
          .map((e) => PizzaSizeApiModel.fromJson(e))
          .toList(),
      pizzaFlavors: (data['pizza_flavors'] as List)
          .map((e) => PizzaFlavorApiModel.fromJson(e))
          .toList(),
      products: (data['products'] as List)
          .map((e) => MenuItemModel.fromJson(e))
          .toList(),
      neighborhoods: (data['neighborhoods'] as List)
          .map((e) => NeighborhoodModel.fromJson(e))
          .toList(),
    );
  }
}
