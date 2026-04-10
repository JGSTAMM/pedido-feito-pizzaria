import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:waiter_app/features/auth/screens/login_screen.dart';
import 'package:waiter_app/features/menu/screens/tables_screen.dart';
import 'package:waiter_app/features/order/screens/order_screen.dart';
import 'package:waiter_app/features/auth/providers/auth_provider.dart';
import 'package:waiter_app/features/menu/providers/menu_provider.dart';
import 'package:waiter_app/features/order/providers/order_provider.dart';
import 'package:waiter_app/features/menu/models/table_model.dart';
import 'package:waiter_app/features/menu/models/product_model.dart';

import 'mocks.dart';

void main() {
  group('Waiter App UI Tests', () {
    late MockAuthProvider mockAuth;
    late MockMenuProvider mockMenu;
    late MockOrderProvider mockOrder;

    setUp(() {
      mockAuth = MockAuthProvider();
      mockMenu = MockMenuProvider();
      mockOrder = MockOrderProvider();
    });

    Widget createWidgetUnderTest(Widget child) {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: mockAuth),
          ChangeNotifierProvider<MenuProvider>.value(value: mockMenu),
          ChangeNotifierProvider<OrderProvider>.value(value: mockOrder),
        ],
        child: MaterialApp(home: child),
      );
    }

    testWidgets('Login Screen displays correctly', (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      await tester.pumpWidget(createWidgetUnderTest(const LoginScreen()));

      expect(find.text('Pedido Feito'), findsOneWidget);
      expect(find.text('App do Garçom'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2)); // Email & Password
      expect(find.text('Entrar'), findsOneWidget);

      await tester.binding.setSurfaceSize(null);
    });

    testWidgets('Login failure shows error', (WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(1080, 1920));
      await tester.pumpWidget(createWidgetUnderTest(const LoginScreen()));

      await tester.enterText(
        find.byType(TextFormField).first,
        'wrong@test.com',
      );
      await tester.enterText(find.byType(TextFormField).last, 'wrongpass');
      final loginButton = find.widgetWithText(ElevatedButton, 'Entrar');
      final buttonWidget = tester.widget<ElevatedButton>(loginButton);
      buttonWidget.onPressed!.call();
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);

      await tester.binding.setSurfaceSize(null);
    });

    testWidgets('Tables Screen displays tables', (WidgetTester tester) async {
      // Pre-load data
      await mockMenu.loadData();

      await tester.pumpWidget(createWidgetUnderTest(const TablesScreen()));
      await tester.pumpAndSettle(); // Wait for FutureBuilder/async ops

      expect(find.text('Mesa 1'), findsOneWidget);
      expect(find.text('LIVRE'), findsOneWidget);
      expect(find.text('Mesa 2'), findsOneWidget);
      expect(find.text('OCUPADA'), findsOneWidget);
    });

    testWidgets('Order Screen - Pizza Tab interactions', (
      WidgetTester tester,
    ) async {
      await mockMenu.loadData();
      final table = mockMenu.tables.first;

      await tester.pumpWidget(createWidgetUnderTest(OrderScreen(table: table)));
      await tester.pumpAndSettle();

      // Verify Pizza Tab is active
      expect(find.text('Tamanho:'), findsOneWidget);

      // Select Size
      await tester.tap(find.text('Grande (8 fat.)'));
      await tester.pump();

      // Select Flavors
      await tester.tap(find.text('Calabresa'));
      await tester.pump();

      // Add to Cart
      await tester.tap(find.text('Adicionar ao Carrinho'));
      await tester.pumpAndSettle();

      expect(find.text('Pizza adicionada ao carrinho!'), findsOneWidget);

      // Check OrderProvider state
      expect(mockOrder.cartItems.length, 1);
      expect(mockOrder.cartItems.first.name, 'Pizza Grande');
    });

    testWidgets('Order Screen - Product Tab interactions', (
      WidgetTester tester,
    ) async {
      await mockMenu.loadData();
      final table = mockMenu.tables.first;

      await tester.pumpWidget(createWidgetUnderTest(OrderScreen(table: table)));
      await tester.pumpAndSettle();

      // Switch to Products Tab
      await tester.tap(find.text('Bebidas/Produtos'));
      await tester.pumpAndSettle();

      expect(find.text('Coca-Cola'), findsOneWidget);

      // Open add product dialog
      await tester.tap(find.byIcon(Icons.add_circle).first);
      await tester.pumpAndSettle();

      expect(find.text('Deseja adicionar alguma observação?'), findsOneWidget);

      // Confirm add product
      await tester.tap(find.text('Adicionar'));
      await tester.pumpAndSettle();

      expect(find.text('Coca-Cola adicionado ao carrinho!'), findsOneWidget);

      // Check OrderProvider state
      // Note: cartItems length might be 1 if previous test state leaked,
      // but setUp creates fresh mocks each time.
      expect(mockOrder.cartItems.length, 1);
      expect(mockOrder.cartItems.first.name, 'Coca-Cola');
    });

    testWidgets('Cart Tab - Send Order', (WidgetTester tester) async {
      // Setup cart
      final product = ProductModel(
        id: 1,
        name: 'Coke',
        price: 5,
        category: 'drink',
      );
      mockOrder.addProduct(product);

      final table = TableModel(id: 1, name: 'Mesa 1', status: 'available');

      await tester.pumpWidget(createWidgetUnderTest(OrderScreen(table: table)));
      await tester.pumpAndSettle();

      // Switch to Cart Tab
      await tester.tap(find.text('Carrinho'));
      await tester.pumpAndSettle();

      expect(find.text('Coke'), findsOneWidget);
      expect(find.text('ENVIAR PEDIDO'), findsOneWidget);

      // Send Order
      await tester.tap(find.text('ENVIAR PEDIDO'));
      await tester.pumpAndSettle();

      // Since OrderScreen calls Navigator.pop on success, and OrderScreen is the home,
      // we expect it to be removed or the app to be empty.
      // However, simply checking if OrderScreen is present or not is safer.
      expect(find.byType(OrderScreen), findsNothing);
    });
  });
}
