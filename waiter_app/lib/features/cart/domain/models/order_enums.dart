
enum DeliveryMethod {
  delivery,
  pickup,
}

enum PaymentMethod {
  pix_online, // Pix (Online)
  credit_online, // Cartão de Crédito (Online)
  money, // Dinheiro (Troco para...)
  card_machine, // Maquininha (Cartão na Entrega/Retirada)
}

extension PaymentMethodLabels on PaymentMethod {
  String get label {
    switch (this) {
      case PaymentMethod.pix_online:
        return 'Pix Online';
      case PaymentMethod.credit_online:
        return 'Cartão (Online)';
      case PaymentMethod.money:
        return 'Dinheiro';
      case PaymentMethod.card_machine:
        return 'Maquininha';
    }
  }
}
