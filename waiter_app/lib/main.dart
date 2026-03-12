import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart' as provider;
import 'features/digital_menu/presentation/screens/welcome_screen.dart';
import 'features/digital_menu/presentation/screens/menu_screen.dart';
import 'features/pizza_builder/presentation/screens/pizza_builder_screen.dart';
import 'features/cart/presentation/screens/checkout_screen.dart';
import 'features/cart/presentation/screens/customer_identification_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/menu/providers/menu_provider.dart';
import 'features/menu/screens/tables_screen.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    // ─── Digital Menu (Cliente) ───
    GoRoute(
      path: '/',
      builder: (context, state) => const WelcomeScreen(),
    ),
    GoRoute(
      path: '/menu',
      builder: (context, state) => const MenuScreen(),
    ),
    GoRoute(
      path: '/pizza-builder',
      builder: (context, state) => const PizzaBuilderScreen(),
    ),
    GoRoute(
      path: '/identify',
      builder: (context, state) => const CustomerIdentificationScreen(),
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),

    // ─── Waiter App (Garçom) ───
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/waiter/home',
      builder: (context, state) => const TablesScreen(),
    ),
  ],
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return provider.MultiProvider(
      providers: [
        provider.ChangeNotifierProvider(create: (_) => AuthProvider()),
        provider.ChangeNotifierProvider(create: (_) => MenuProvider()),
      ],
      child: MaterialApp.router(
        title: 'Lucchese Pizzaria',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: _router,
      ),
    );
  }
}
