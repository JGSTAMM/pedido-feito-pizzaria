
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:waiter_app/features/cart/domain/models/order_enums.dart';
import 'package:waiter_app/features/cart/presentation/providers/cart_notifier.dart';

void main() {
  group('Cart Logic', () {
    test('Initial state is Empty and Pickup', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final state = container.read(cartProvider);

      expect(state.items.isEmpty, true);
      expect(state.deliveryMethod, DeliveryMethod.pickup);
      expect(state.deliveryFee, 0.0);
    });

    test('Delivery Fee is applied when neighborhood is set', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(cartProvider.notifier);
      
      notifier.setDeliveryMethod(DeliveryMethod.delivery);
      notifier.setNeighborhood('Centro', 8.00);
      
      final state = container.read(cartProvider);
      expect(state.deliveryMethod, DeliveryMethod.delivery);
      expect(state.deliveryFee, 8.00);
    });

    test('Delivery Fee is zero without neighborhood', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(cartProvider.notifier);
      
      notifier.setDeliveryMethod(DeliveryMethod.delivery);
      
      final state = container.read(cartProvider);
      expect(state.deliveryMethod, DeliveryMethod.delivery);
      expect(state.deliveryFee, 0.0);
    });

    test('Total calculation includes fee', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(cartProvider.notifier);
      
      notifier.setDeliveryMethod(DeliveryMethod.delivery);
      notifier.setNeighborhood('Centro', 8.00);
      // Subtotal 0 + Fee 8 = 8
      expect(container.read(cartProvider).total, 8.00);
    });

    test('Payment Method cleared on Delivery switch when card_machine', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(cartProvider.notifier);
      
      // set pickup
      notifier.setDeliveryMethod(DeliveryMethod.pickup);
      // set card_machine
      notifier.setPaymentMethod(PaymentMethod.card_machine);
      
      expect(container.read(cartProvider).paymentMethod, PaymentMethod.card_machine);
      
      // Switch to Delivery -> Should clear payment method because card_machine is invalid
      notifier.setDeliveryMethod(DeliveryMethod.delivery);
      
      expect(container.read(cartProvider).paymentMethod, null);
    });

    test('Neighborhood fee cleared when switching to pickup', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      final notifier = container.read(cartProvider.notifier);
      
      notifier.setDeliveryMethod(DeliveryMethod.delivery);
      notifier.setNeighborhood('Centro', 8.00);
      expect(container.read(cartProvider).deliveryFee, 8.00);
      
      notifier.setDeliveryMethod(DeliveryMethod.pickup);
      expect(container.read(cartProvider).deliveryFee, 0.0);
    });
  });
}
