
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/cart_item_model.dart';
import '../../domain/models/order_enums.dart';

class CartState {
  final List<CartItemModel> items;
  final DeliveryMethod deliveryMethod;
  final PaymentMethod? paymentMethod;
  final String? selectedNeighborhoodName;
  final double? selectedNeighborhoodFee;

  const CartState({
    this.items = const [],
    this.deliveryMethod = DeliveryMethod.pickup,
    this.paymentMethod,
    this.selectedNeighborhoodName,
    this.selectedNeighborhoodFee,
  });

  double get subtotal => items.fold(0, (sum, item) => sum + item.totalPrice);
  
  double get deliveryFee {
    if (deliveryMethod != DeliveryMethod.delivery) return 0.0;
    return selectedNeighborhoodFee ?? 0.0;
  }
  
  double get total => subtotal + deliveryFee;

  CartState copyWith({
    List<CartItemModel>? items,
    DeliveryMethod? deliveryMethod,
    PaymentMethod? paymentMethod,
    bool replacePaymentMethod = false,
    String? selectedNeighborhoodName,
    double? selectedNeighborhoodFee,
    bool clearNeighborhood = false,
  }) {
    return CartState(
      items: items ?? this.items,
      deliveryMethod: deliveryMethod ?? this.deliveryMethod,
      paymentMethod: replacePaymentMethod ? paymentMethod : (paymentMethod ?? this.paymentMethod),
      selectedNeighborhoodName: clearNeighborhood ? null : (selectedNeighborhoodName ?? this.selectedNeighborhoodName),
      selectedNeighborhoodFee: clearNeighborhood ? null : (selectedNeighborhoodFee ?? this.selectedNeighborhoodFee),
    );
  }
}

class CartNotifier extends Notifier<CartState> {
  @override
  CartState build() {
    return const CartState();
  }

  void addItem(CartItemModel item) {
    state = state.copyWith(items: [...state.items, item]);
  }

  void removeItem(CartItemModel item) {
    final newItems = state.items.where((i) => i != item).toList();
    state = state.copyWith(items: newItems);
  }

  void clearCart() {
    state = const CartState();
  }

  void setDeliveryMethod(DeliveryMethod method) {
    if (state.deliveryMethod == method) return;
    
    PaymentMethod? newPayment = state.paymentMethod;
    if (method == DeliveryMethod.delivery && state.paymentMethod == PaymentMethod.card_machine) {
      newPayment = null;
    }
    
    state = state.copyWith(
        deliveryMethod: method, 
        paymentMethod: newPayment,
        replacePaymentMethod: true,
    );
  }

  void setPaymentMethod(PaymentMethod method) {
    state = state.copyWith(paymentMethod: method);
  }

  void setNeighborhood(String name, double fee) {
    state = state.copyWith(
      selectedNeighborhoodName: name,
      selectedNeighborhoodFee: fee,
    );
  }

  void clearNeighborhood() {
    state = state.copyWith(clearNeighborhood: true);
  }
}

final cartProvider = NotifierProvider<CartNotifier, CartState>(CartNotifier.new);
