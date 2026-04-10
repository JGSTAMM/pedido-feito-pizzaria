import 'package:flutter/foundation.dart';
import '../../../core/services/api_service.dart';
import '../models/sync_data_model.dart';
import '../models/table_model.dart';
import '../models/product_model.dart';
import '../models/pizza_size_model.dart';
import '../models/pizza_flavor_model.dart';

class MenuProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<TableModel> _tables = [];
  List<ProductModel> _products = [];
  List<PizzaSizeModel> _pizzaSizes = [];
  List<PizzaFlavorModel> _pizzaFlavors = [];
  
  bool _isLoading = false;
  String? _errorMessage;

  List<TableModel> get tables => _tables;
  List<ProductModel> get products => _products;
  List<PizzaSizeModel> get pizzaSizes => _pizzaSizes;
  List<PizzaFlavorModel> get pizzaFlavors => _pizzaFlavors;
  
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<TableModel> get freeTables => 
      _tables.where((t) => t.status == 'available').toList();

  Future<void> loadData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.dio.get('/sync');
      final syncData = SyncDataModel.fromJson(response.data);

      _tables = syncData.tables;
      // Filter out 'Extras' category (borders, promo pizzas handled in pizza tab)
      _products = syncData.products
          .where((p) => p.category.toLowerCase() != 'extras' && p.category.toLowerCase() != 'arquivo')
          .toList();
      _pizzaSizes = syncData.pizzaSizes;
      _pizzaFlavors = syncData.pizzaFlavors;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      // Re-throw if you want the UI to handle it explicitly alongside the error message state
      // rethrow; 
    }
  }
  Future<void> closeTable(String tableId) async {
    try {
      await _apiService.dio.post('/tables/$tableId/close');
      await loadData(); // Refresh tables
    } catch (e) {
      rethrow;
    }
  }

  Future<void> payAndCloseTable(String tableId, List<Map<String, dynamic>> payments) async {
    try {
      await _apiService.dio.post('/tables/$tableId/pay', data: {
        'payments': payments,
      });
      await loadData();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> getReadyOrders() async {
    try {
      final response = await _apiService.dio.get('/orders/ready');
      return response.data['orders'] ?? [];
    } catch (e) {
      debugPrint('Error checking ready orders: $e');
      return [];
    }
  }
}
