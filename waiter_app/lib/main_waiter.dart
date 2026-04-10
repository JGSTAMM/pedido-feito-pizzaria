import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' hide Consumer;
import 'features/auth/providers/auth_provider.dart';
import 'features/menu/providers/menu_provider.dart';
import 'features/order/providers/order_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/menu/screens/tables_screen.dart';
import 'core/theme/app_theme.dart';

/// Waiter application entrypoint.
/// Legacy digital menu startup flow was removed from this app.
///
/// Dev:   flutter run -t lib/main_waiter.dart -d chrome --web-port=8081
/// Build: flutter build apk -t lib/main_waiter.dart   (Android)
///        flutter build ios -t lib/main_waiter.dart    (iOS)
void main() {
  runApp(
    // ProviderScope (Riverpod) para futuras features compartilhadas
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
}

class WaiterApp extends StatelessWidget {
  const WaiterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pedido Feito - Garçom',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated) {
            return const TablesScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
