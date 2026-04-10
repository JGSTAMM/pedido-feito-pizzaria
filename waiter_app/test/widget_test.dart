import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' hide Consumer;
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:waiter_app/features/auth/providers/auth_provider.dart';
import 'package:waiter_app/features/menu/providers/menu_provider.dart';
import 'package:waiter_app/features/order/providers/order_provider.dart';
import 'package:waiter_app/main_waiter.dart';

void main() {
  testWidgets('Waiter app boots successfully', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MultiProvider(
          providers: [
            ChangeNotifierProvider(create: (_) => AuthProvider()),
            ChangeNotifierProvider(create: (_) => MenuProvider()),
            ChangeNotifierProvider(create: (_) => OrderProvider()),
          ],
          child: const WaiterApp(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
