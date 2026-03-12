
import 'package:equatable/equatable.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/pizza_model.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/flavor_model.dart';
import 'package:waiter_app/features/digital_menu/domain/models/menu_item_model.dart';

class CartItemModel extends Equatable {
  final String id;
  final PizzaModel? pizza;       // Para pizzas montadas
  final MenuItemModel? menuItem; // Para bebidas/extras
  final int quantity;
  final String? observation;

  const CartItemModel({
    required this.id,
    this.pizza,
    this.menuItem,
    this.quantity = 1,
    this.observation,
  });

  double get totalPrice {
    if (pizza != null) {
      return pizza!.calculateTotalPrice() * quantity;
    }
    if (menuItem != null) {
      return menuItem!.price * quantity;
    }
    return 0.0;
  }

  String get displayName {
    if (pizza != null) {
      String sizeName = pizza!.size == PizzaSize.large ? 'Grande' : 'Broto';
      final flavors = pizza!.selectedFlavors.values
          .whereType<FlavorModel>()
          .map((f) => f.name)
          .join('/');
      return 'Pizza $sizeName ($flavors)';
    }
    if (menuItem != null) {
      return menuItem!.name;
    }
    return 'Item desconhecido';
  }
  
  String get description {
    return '${quantity}x $displayName';
  }

  CartItemModel copyWith({
    String? id,
    PizzaModel? pizza,
    MenuItemModel? menuItem,
    int? quantity,
    String? observation,
  }) {
    return CartItemModel(
      id: id ?? this.id,
      pizza: pizza ?? this.pizza,
      menuItem: menuItem ?? this.menuItem,
      quantity: quantity ?? this.quantity,
      observation: observation ?? this.observation,
    );
  }

  @override
  List<Object?> get props => [id, pizza, menuItem, quantity, observation];
}
