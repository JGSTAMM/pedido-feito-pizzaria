import 'package:waiter_app/features/auth/providers/auth_provider.dart';
import 'package:waiter_app/features/menu/providers/menu_provider.dart';
import 'package:waiter_app/features/order/providers/order_provider.dart';
import 'package:waiter_app/features/menu/models/table_model.dart';
import 'package:waiter_app/features/menu/models/pizza_size_model.dart';
import 'package:waiter_app/features/menu/models/pizza_flavor_model.dart';
import 'package:waiter_app/features/menu/models/product_model.dart';

class MockAuthProvider extends AuthProvider {
  bool _isAuthenticated = false;

  @override
  bool get isAuthenticated => _isAuthenticated;

  @override
  Future<bool> login(String email, String password) async {
    if (email == 'test@test.com' && password == 'password') {
      _isAuthenticated = true;
      notifyListeners();
      return true;
    }
    return false;
  }

  @override
  Future<void> checkAuth() async {
    // Do nothing or simulate auto-login
  }
}

class MockMenuProvider extends MenuProvider {
  List<TableModel> _testTables = [];
  List<PizzaSizeModel> _testSizes = [];
  List<PizzaFlavorModel> _testFlavors = [];
  List<ProductModel> _testProducts = [];

  @override
  List<TableModel> get tables => _testTables;
  @override
  List<PizzaSizeModel> get pizzaSizes => _testSizes;
  @override
  List<PizzaFlavorModel> get pizzaFlavors => _testFlavors;
  @override
  List<ProductModel> get products => _testProducts;

  @override
  Future<void> loadData() async {
    _testTables = [
      TableModel(id: 1, name: 'Mesa 1', status: 'available'),
      TableModel(id: 2, name: 'Mesa 2', status: 'occupied'),
    ];
    _testSizes = [
      PizzaSizeModel(
        id: 1,
        name: 'Grande',
        slices: 8,
        maxFlavors: 2,
        isSpecialBrotoRule: false,
      ),
      PizzaSizeModel(
        id: 2,
        name: 'Broto',
        slices: 4,
        maxFlavors: 1,
        isSpecialBrotoRule: true,
      ),
    ];
    _testFlavors = [
      PizzaFlavorModel(
        id: 1,
        name: 'Calabresa',
        basePrice: 40.0,
        isActive: true,
      ),
      PizzaFlavorModel(
        id: 2,
        name: 'Mussarela',
        basePrice: 38.0,
        isActive: true,
      ),
    ];
    _testProducts = [
      ProductModel(id: 1, name: 'Coca-Cola', price: 8.0, category: 'bebidas'),
    ];
    notifyListeners();
  }
}

class MockOrderProvider extends OrderProvider {
  @override
  Future<bool> sendOrder(int tableId) async {
    return true;
  }
}
