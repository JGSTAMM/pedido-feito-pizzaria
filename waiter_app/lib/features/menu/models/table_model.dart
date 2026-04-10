class TableModel {
  final String id;
  final String name;
  final String status; // 'available', 'occupied', etc.

  TableModel({required this.id, required this.name, required this.status});

  factory TableModel.fromJson(Map<String, dynamic> json) {
    return TableModel(
      id: json['id'],
      name: json['name'],
      status: json['status'] ?? 'available',
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'status': status};
  }
}
