import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/core/l10n/content_translations.dart';
import 'package:waiter_app/features/cart/presentation/providers/cart_notifier.dart';
import 'package:waiter_app/features/digital_menu/data/menu_api_repository.dart';
import 'package:waiter_app/features/digital_menu/domain/models/menu_item_model.dart';
import 'package:waiter_app/features/digital_menu/presentation/providers/digital_menu_provider.dart';
import 'package:waiter_app/features/digital_menu/presentation/widgets/drink_add_modal.dart';

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════
const _kPrimaryRed = Color(0xFFE53935);
const _kDarkText = Color(0xFF1A1A2E);
const _kSubtleText = Color(0xFF6B7280);
const _kBackground = Color(0xFFF5F5F5);
const _kCardWhite = Color(0xFFFFFFFF);
const _kGreenPrice = Color(0xFF2E7D32);
const _kOrange = Color(0xFFFF6B35);

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final menuAsync = ref.watch(digitalMenuProvider);
    final t = ref.watch(translationsProvider);
    final tr = ref.watch(contentTranslatorProvider);

    return Scaffold(
      backgroundColor: _kBackground,
      body: switch (menuAsync) {
        AsyncLoading() => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(color: _kPrimaryRed),
                const SizedBox(height: 16),
                Text(t['menu_loading']!, style: const TextStyle(color: _kSubtleText)),
              ],
            ),
          ),
        AsyncError(:final error) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.wifi_off, size: 64, color: _kSubtleText),
                  const SizedBox(height: 16),
                  Text(t['menu_error']!,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _kDarkText)),
                  const SizedBox(height: 8),
                  Text(error.toString(), style: const TextStyle(color: _kSubtleText), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => ref.invalidate(digitalMenuProvider),
                    icon: const Icon(Icons.refresh),
                    label: Text(t['menu_retry']!),
                    style: ElevatedButton.styleFrom(backgroundColor: _kPrimaryRed, foregroundColor: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        AsyncData(:final value) => _MenuContent(menuData: value, cart: cart, t: t, tr: tr),
      },

      // Bottom Navigation
      bottomNavigationBar: _BottomNavBar(cart: cart, t: t),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN CONTENT (when data loaded)
// ═══════════════════════════════════════════════════════════
class _MenuContent extends StatelessWidget {
  final DigitalMenuData menuData;
  final CartState cart;
  final Map<String, String> t;
  final String Function(String) tr;

  const _MenuContent({required this.menuData, required this.cart, required this.t, required this.tr});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // HEADER — Logo + Nome + Status
        SliverToBoxAdapter(child: _buildHeader(context)),

        // SEÇÃO: Pizzas (carrossel horizontal)
        if (menuData.pizzaFlavors.isNotEmpty) ...[
          _buildSectionTitle(t['menu_most_ordered']!),
          SliverToBoxAdapter(child: _buildPizzaCarousel(context)),
          SliverToBoxAdapter(child: _buildMontarPizzaButton(context)),
        ],

        // SEÇÕES: Produtos por categoria (lista vertical)
        ..._buildProductSections(context),

        // Espaço para bottom nav
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════
  Widget _buildHeader(BuildContext context) {
    return Container(
      color: _kPrimaryRed,
      padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
      child: GestureDetector(
        onTap: () => context.go('/'),
        child: Row(
          children: [
            // Logo
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _kCardWhite,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Center(child: Text('🍕', style: TextStyle(fontSize: 24))),
            ),
            const SizedBox(width: 12),
            // Nome e horário
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t['welcome_subtitle']!,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    t['menu_open_hours']!,
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION TITLE
  // ═══════════════════════════════════════════════════════════
  SliverToBoxAdapter _buildSectionTitle(String title) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: _kDarkText,
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PIZZA CAROUSEL (horizontal scroll)
  // ═══════════════════════════════════════════════════════════
  Widget _buildPizzaCarousel(BuildContext context) {
    final flavors = menuData.pizzaFlavors;

    return SizedBox(
      height: 160,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: flavors.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final flavor = flavors[index];
          return GestureDetector(
            onTap: () => context.push('/pizza-builder'),
            child: SizedBox(
              width: 130,
              child: Column(
                children: [
                  // Image placeholder
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: _kOrange.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.local_pizza, size: 40, color: _kOrange.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(height: 8),
                  // Name
                  Text(
                    tr(flavor.name).toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: _kDarkText,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  // Price
                  Text(
                    'R\$ ${flavor.basePrice.toStringAsFixed(2).replaceAll('.', ',')}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kGreenPrice),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // BOTÃO "MONTAR MINHA PIZZA"
  // ═══════════════════════════════════════════════════════════
  Widget _buildMontarPizzaButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton.icon(
          onPressed: () => context.push('/pizza-builder'),
          icon: const Icon(Icons.local_pizza),
          label: Text(t['menu_build_pizza']!, style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
          style: ElevatedButton.styleFrom(
            backgroundColor: _kPrimaryRed,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCT SECTIONS (lista vertical agrupada por categoria)
  // ═══════════════════════════════════════════════════════════
  List<Widget> _buildProductSections(BuildContext context) {
    final widgets = <Widget>[];
    // Agrupar produtos por categoria
    final grouped = <MenuCategory, List<MenuItemModel>>{};
    for (final p in menuData.products) {
      grouped.putIfAbsent(p.category, () => []).add(p);
    }

    for (final entry in grouped.entries) {
      final category = entry.key;
      final products = entry.value;

      // Section title
      final emoji = category == MenuCategory.drinks ? '🥤' : '🍽️';
      final catLabel = category == MenuCategory.drinks ? t['menu_drinks']! : (category == MenuCategory.pizzas ? t['menu_pizzas']! : t['menu_extras']!);
      widgets.add(_buildSectionTitle('$emoji $catLabel'));

      // Product list
      widgets.add(
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => _ProductListTile(
              item: products[index],
              tr: tr,
              onTap: () => _showDrinkModal(context, products[index]),
            ),
            childCount: products.length,
          ),
        ),
      );
    }

    return widgets;
  }

  void _showDrinkModal(BuildContext context, MenuItemModel item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DrinkAddModal(item: item),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// PRODUCT LIST TILE (estilo pedido.anota.ai)
// ═══════════════════════════════════════════════════════════
class _ProductListTile extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback onTap;
  final String Function(String) tr;

  const _ProductListTile({required this.item, required this.onTap, required this.tr});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Material(
        color: _kCardWhite,
        borderRadius: BorderRadius.circular(12),
        elevation: 1,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Text info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tr(item.name).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: _kDarkText,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (item.description != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          item.description!,
                          style: const TextStyle(fontSize: 12, color: _kSubtleText),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        'R\$ ${item.price.toStringAsFixed(2).replaceAll('.', ',')}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: _kGreenPrice,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Thumbnail
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: _kOrange.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    item.category == MenuCategory.drinks ? Icons.local_drink : Icons.restaurant,
                    size: 32,
                    color: _kOrange.withValues(alpha: 0.4),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// BOTTOM NAVIGATION BAR
// ═══════════════════════════════════════════════════════════
class _BottomNavBar extends StatelessWidget {
  final CartState cart;
  final Map<String, String> t;

  const _BottomNavBar({required this.cart, required this.t});

  @override
  Widget build(BuildContext context) {
    final itemCount = cart.items.fold<int>(0, (sum, item) => sum + item.quantity);

    return Container(
      decoration: BoxDecoration(
        color: _kCardWhite,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Início
              _NavItem(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: t['menu_nav_home']!,
                isActive: true,
                onTap: () {},
              ),
              // Pedidos
              _NavItem(
                icon: Icons.receipt_long_outlined,
                activeIcon: Icons.receipt_long,
                label: t['menu_nav_orders']!,
                isActive: false,
                onTap: () {},
              ),
              // Carrinho
              _NavItem(
                icon: Icons.shopping_cart_outlined,
                activeIcon: Icons.shopping_cart,
                label: t['menu_nav_cart']!,
                isActive: false,
                badge: itemCount > 0 ? itemCount : null,
                onTap: () => context.push('/checkout'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final int? badge;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: isActive ? _kPrimaryRed : _kSubtleText,
                  size: 24,
                ),
                if (badge != null)
                  Positioned(
                    right: -8,
                    top: -6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: _kPrimaryRed,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Text(
                        '$badge',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                color: isActive ? _kPrimaryRed : _kSubtleText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
