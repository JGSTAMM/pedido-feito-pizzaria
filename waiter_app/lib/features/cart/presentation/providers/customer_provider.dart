import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Dados do cliente que fez o pedido via cardápio digital.
class CustomerInfo {
  final String name;
  final String phone;

  const CustomerInfo({required this.name, required this.phone});

  bool get isValid => name.trim().length >= 3 && phone.replaceAll(RegExp(r'\D'), '').length >= 10;
}

class CustomerNotifier extends Notifier<CustomerInfo?> {
  @override
  CustomerInfo? build() => null;

  void setCustomer(String name, String phone) {
    state = CustomerInfo(name: name, phone: phone);
  }

  void clear() {
    state = null;
  }
}

final customerProvider = NotifierProvider<CustomerNotifier, CustomerInfo?>(() {
  return CustomerNotifier();
});
