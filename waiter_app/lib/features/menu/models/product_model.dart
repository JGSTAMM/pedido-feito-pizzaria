class ProductModel {
  final int id;
  final String name;
  final double price;
  final String category;

  ProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'],
      name: json['name'],
      // Safely parse price which might come as String or Number
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      category: json['category'] ?? 'general',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'category': category,
    };
  }
}
