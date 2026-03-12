
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/core/l10n/content_translations.dart';
import '../../domain/models/flavor_model.dart';
import '../../domain/models/pizza_model.dart';
import 'package:waiter_app/features/digital_menu/presentation/providers/digital_menu_provider.dart';

// ─── Design tokens ───
const _kBgDark = Color(0xFF1A1A1A);
const _kCardDark = Color(0xFF2A2A2A);
const _kSurface = Color(0xFF333333);
const _kAccent = Color(0xFFD32F2F);
const _kAccentLight = Color(0xFFFF5252);
const _kGreenBright = Color(0xFF66BB6A);
const _kTextPrimary = Color(0xFFF5F5F5);
const _kTextSecondary = Color(0xFFBDBDBD);
const _kTextMuted = Color(0xFF9E9E9E);
const _kDivider = Color(0xFF424242);

class FlavorSelectionModal extends ConsumerStatefulWidget {
  final Function(FlavorModel) onFlavorSelected;
  final PizzaSize pizzaSize;

  const FlavorSelectionModal({
    super.key,
    required this.onFlavorSelected,
    this.pizzaSize = PizzaSize.large,
  });

  @override
  ConsumerState<FlavorSelectionModal> createState() => _FlavorSelectionModalState();
}

class _FlavorSelectionModalState extends ConsumerState<FlavorSelectionModal> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final menuAsync = ref.watch(digitalMenuProvider);
    final isBroto = widget.pizzaSize == PizzaSize.broto;
    final t = ref.watch(translationsProvider);
    final tr = ref.watch(contentTranslatorProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.80,
      decoration: const BoxDecoration(
        color: _kBgDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // ─── Header ───
          Container(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
            decoration: const BoxDecoration(
              color: _kCardDark,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: _kDivider,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Text(
                  t['flavor_title']!,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: _kTextPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
                if (isBroto)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: _kAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        t['flavor_broto_rule']!,
                        style: const TextStyle(fontSize: 12, color: _kAccentLight, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ),
                const SizedBox(height: 14),
                // Search bar
                TextField(
                  style: const TextStyle(color: _kTextPrimary, fontSize: 15),
                  decoration: InputDecoration(
                    hintText: t['flavor_search']!,
                    hintStyle: const TextStyle(color: _kTextMuted, fontSize: 14),
                    prefixIcon: const Icon(Icons.search, size: 22, color: _kTextMuted),
                    filled: true,
                    fillColor: _kSurface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: _kDivider),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: _kDivider),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: _kAccent, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value.toLowerCase().trim();
                    });
                  },
                ),
              ],
            ),
          ),
          
          // ─── Flavor List ───
          Expanded(
            child: menuAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: _kAccent)),
              error: (error, stack) => Center(
                  child: Text('Erro: $error', style: const TextStyle(color: _kAccentLight)),
                ),
              data: (value) {
                  final menuData = value;
                  final allFlavors = menuData.pizzaFlavors.map((apiF) {
                    return FlavorModel(
                      id: apiF.id.toString(),
                      name: apiF.name,
                      priceLarge: apiF.basePrice,
                      color: _hashColor(apiF.name),
                      ingredients: apiF.description != null
                          ? apiF.description!.split(',').map((s) => s.trim()).toList()
                          : [],
                    );
                  }).toList();

                  final normalizedQuery = _removeAccents(_searchQuery);
                  final filteredFlavors = normalizedQuery.isEmpty
                      ? allFlavors
                      : allFlavors.where((f) {
                          final nameMatch = _removeAccents(f.name.toLowerCase()).contains(normalizedQuery);
                          final ingredientMatch = f.ingredients.any(
                            (ing) => _removeAccents(ing.toLowerCase()).contains(normalizedQuery),
                          );
                          return nameMatch || ingredientMatch;
                        }).toList();

                  if (filteredFlavors.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.search_off, size: 48, color: _kTextMuted),
                          const SizedBox(height: 12),
                          Text(
                            '${t['flavor_not_found']!} "$_searchQuery"',
                            style: const TextStyle(color: _kTextSecondary, fontSize: 15),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: filteredFlavors.length,
                    itemBuilder: (context, index) {
                      final flavor = filteredFlavors[index];
                      final displayPrice = isBroto
                          ? (flavor.priceLarge / 2) + 5
                          : flavor.priceLarge;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Material(
                          color: _kCardDark,
                          borderRadius: BorderRadius.circular(14),
                          child: InkWell(
                            onTap: () {
                              widget.onFlavorSelected(flavor);
                              Navigator.pop(context);
                            },
                            borderRadius: BorderRadius.circular(14),
                            splashColor: _kAccent.withValues(alpha: 0.1),
                            highlightColor: _kAccent.withValues(alpha: 0.05),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: _kDivider),
                              ),
                              child: Row(
                                children: [
                                  // Pizza icon
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: (flavor.color ?? _kAccent).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.local_pizza,
                                      size: 26,
                                      color: flavor.color ?? _kAccentLight,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  // Name + ingredients
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          tr(flavor.name),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: _kTextPrimary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (flavor.ingredients.isNotEmpty) ...[
                                          const SizedBox(height: 3),
                                          Text(
                                            flavor.ingredients.map((i) => tr(i)).join(', '),
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: _kTextSecondary,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Price
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'R\$ ${displayPrice.toStringAsFixed(2)}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: _kGreenBright,
                                          fontSize: 16,
                                        ),
                                      ),
                                      if (isBroto)
                                        Text(
                                          '${t['flavor_grande_ref']!} R\$ ${flavor.priceLarge.toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: _kTextMuted,
                                            decoration: TextDecoration.lineThrough,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _hashColor(String name) {
    final hash = name.hashCode;
    final hue = (hash % 360).abs().toDouble();
    return HSLColor.fromAHSL(1.0, hue, 0.5, 0.65).toColor();
  }

  String _removeAccents(String text) {
    const accents = 'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ';
    const noAccents = 'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC';
    
    String result = text;
    for (int i = 0; i < accents.length; i++) {
      result = result.replaceAll(accents[i], noAccents[i]);
    }
    return result;
  }
}
