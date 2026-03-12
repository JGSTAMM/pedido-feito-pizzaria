class PizzaSizeModel {
  final int id;
  final String name;
  final int slices;
  final int maxFlavors;
  final bool isSpecialBrotoRule;

  PizzaSizeModel({
    required this.id,
    required this.name,
    required this.slices,
    required this.maxFlavors,
    required this.isSpecialBrotoRule,
  });

  factory PizzaSizeModel.fromJson(Map<String, dynamic> json) {
    return PizzaSizeModel(
      id: json['id'],
      name: json['name'],
      // Safely parse slices (int)
      slices: int.tryParse(json['slices'].toString()) ?? 8,
      // Safely parse maxFlavors (int)
      maxFlavors: int.tryParse(json['max_flavors'].toString()) ?? 1,
      // Parse boolean (might be 0/1 or true/false)
      isSpecialBrotoRule: json['is_special_broto_rule'] == 1 || json['is_special_broto_rule'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slices': slices,
      'max_flavors': maxFlavors,
      'is_special_broto_rule': isSpecialBrotoRule,
    };
  }
}
