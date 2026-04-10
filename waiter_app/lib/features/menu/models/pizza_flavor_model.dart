class PizzaFlavorModel {
  final String id;
  final String name;
  final double basePrice;
  final bool isActive;
  final String? description;

  PizzaFlavorModel({
    required this.id,
    required this.name,
    required this.basePrice,
    required this.isActive,
    this.description,
  });

  factory PizzaFlavorModel.fromJson(Map<String, dynamic> json) {
    return PizzaFlavorModel(
      id: json['id'],
      name: json['name'],
      basePrice: double.tryParse(json['base_price'].toString()) ?? 0.0,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'base_price': basePrice,
      'is_active': isActive,
      'description': description,
    };
  }
}
