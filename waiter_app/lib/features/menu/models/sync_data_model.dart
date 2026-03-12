import 'table_model.dart';
import 'product_model.dart';
import 'pizza_size_model.dart';
import 'pizza_flavor_model.dart';

class SyncDataModel {
  final List<TableModel> tables;
  final List<ProductModel> products;
  final List<PizzaSizeModel> pizzaSizes;
  final List<PizzaFlavorModel> pizzaFlavors;

  SyncDataModel({
    required this.tables,
    required this.products,
    required this.pizzaSizes,
    required this.pizzaFlavors,
  });

  factory SyncDataModel.fromJson(Map<String, dynamic> json) {
    return SyncDataModel(
      tables:
          (json['tables'] as List?)
              ?.map((e) => TableModel.fromJson(e))
              .toList() ??
          [],
      products:
          (json['products'] as List?)
              ?.map((e) => ProductModel.fromJson(e))
              .toList() ??
          [],
      pizzaSizes:
          (json['pizza_sizes'] as List?)
              ?.map((e) => PizzaSizeModel.fromJson(e))
              .toList() ??
          [],
      pizzaFlavors:
          (json['pizza_flavors'] as List?)
              ?.map((e) => PizzaFlavorModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
