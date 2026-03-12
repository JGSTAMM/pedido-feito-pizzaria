import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:waiter_app/features/digital_menu/data/menu_api_repository.dart';

/// Provider que expõe os dados do cardápio digital como um AsyncValue.
/// Carrega da API automaticamente quando a tela é aberta.
final digitalMenuProvider = FutureProvider<DigitalMenuData>((ref) async {
  final repository = MenuApiRepository();
  return repository.fetchMenu();
});
