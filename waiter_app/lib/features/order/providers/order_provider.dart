import 'package:flutter/material.dart';
import '../../menu/models/pizza_size_model.dart';
import '../../menu/models/pizza_flavor_model.dart';
import '../../menu/models/product_model.dart';
import '../../../core/services/api_service.dart';


class OrderItem {
  final String id;
  final String type; // 'pizza' or 'product'
  final String name;
  final double estimatedPrice;
  final String? notes;
  final String? border; // Border type: cheddar, catupiry, chocolate
  // Pizza specifics
  final PizzaSizeModel? size;
  final List<PizzaFlavorModel>? flavors;
  // Product specifics
  final ProductModel? product;
  final int quantity;

  static const double borderPrice = 20.00;
  static const Map<String, String> borderOptions = {
    '': 'Sem Borda',
    'cheddar': 'Cheddar',
    'catupiry': 'Catupiry',
    'chocolate': 'Chocolate com Avelã',
  };

  OrderItem({
    required this.id,
    required this.type,
    required this.name,
    required this.estimatedPrice,
    this.notes,
    this.border,
    this.size,
    this.flavors,
    this.product,
    this.quantity = 1,
  });
}

class OrderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final List<OrderItem> _cartItems = [];
  bool _isSending = false;

  List<OrderItem> get cartItems => _cartItems;
  bool get isSending => _isSending;

  void addPizza(PizzaSizeModel size, List<PizzaFlavorModel> flavors, {String? notes, String? border}) {
    double estimatedPrice = 0.0;
    if (flavors.isNotEmpty) {
      if (size.isSpecialBrotoRule) {
        // Rule: Broto (Flavor Price / 2) + 5.00
        double basePrice = flavors.first.basePrice;
        estimatedPrice = (basePrice / 2) + 5.00;
      } else {
        // Rule: Standard (Highest value among selected flavors)
        estimatedPrice = flavors
            .map((f) => f.basePrice)
            .reduce((a, b) => a > b ? a : b);
      }
    }

    // Add border price
    if (border != null && border.isNotEmpty) {
      estimatedPrice += OrderItem.borderPrice;
    }

    // Build notes with border info
    String? finalNotes = notes;
    if (border != null && border.isNotEmpty) {
      final borderLabel = OrderItem.borderOptions[border] ?? border;
      final borderNote = 'Borda: $borderLabel';
      finalNotes = finalNotes != null && finalNotes.isNotEmpty
          ? '$borderNote | $finalNotes'
          : borderNote;
    }

    final newItem = OrderItem(
      id: DateTime.now().toString(),
      type: 'pizza',
      name: 'Pizza ${size.name}',
      estimatedPrice: estimatedPrice,
      size: size,
      flavors: flavors,
      notes: finalNotes,
      border: border,
    );

    _cartItems.add(newItem);
    notifyListeners();
  }

  void addProduct(ProductModel product, {String? notes}) {
    final newItem = OrderItem(
      id: DateTime.now().toString(),
      type: 'product',
      name: product.name,
      estimatedPrice: product.price,
      product: product,
      notes: notes,
    );

    _cartItems.add(newItem);
    notifyListeners();
  }

  void removeItem(String id) {
    _cartItems.removeWhere((item) => item.id == id);
    notifyListeners();
  }

  Future<bool> sendOrder(String tableId) async {
    if (_cartItems.isEmpty) return false;

    _isSending = true;
    notifyListeners();

    try {
      final itemsData = _cartItems.map((item) {
        if (item.type == 'pizza') {
          return {
            'type': 'pizza',
            'size_id': item.size!.id,
            'flavor_ids': item.flavors!.map((f) => f.id).toList(),
            'quantity': 1,
            'notes': item.notes,
          };
        } else {
          return {
            'type': 'product',
            'product_id': item.product!.id,
            'quantity': 1,
            'notes': item.notes,
          };
        }
      }).toList();

      await _apiService.dio.post('/orders', data: {
        'table_id': tableId,
        'items': itemsData,
        'type': 'salon', // or from UI
      });

      _cartItems.clear();
      _isSending = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isSending = false;
      notifyListeners();
      return false;
    }
  }
}
