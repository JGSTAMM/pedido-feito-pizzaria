
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:waiter_app/core/l10n/app_translations.dart';
import 'package:waiter_app/features/cart/domain/models/order_enums.dart';
import 'package:waiter_app/features/cart/domain/models/cart_item_model.dart';
import 'package:waiter_app/features/cart/presentation/providers/cart_notifier.dart';
import 'package:waiter_app/features/cart/presentation/providers/customer_provider.dart';
import 'package:waiter_app/features/digital_menu/presentation/providers/digital_menu_provider.dart';
import 'package:waiter_app/features/digital_menu/domain/models/menu_item_model.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/pizza_model.dart';
import 'package:waiter_app/features/pizza_builder/domain/models/flavor_model.dart';
import 'package:waiter_app/core/l10n/content_translations.dart';

// ─── Design tokens ───
const _kBgDark = Color(0xFF1A1A1A);
const _kCardDark = Color(0xFF2A2A2A);
const _kSurface = Color(0xFF333333);
const _kAccent = Color(0xFFD32F2F);
const _kAccentLight = Color(0xFFFF5252);
const _kGreen = Color(0xFF4CAF50);
const _kGreenBright = Color(0xFF66BB6A);
const _kTextPrimary = Color(0xFFF5F5F5);
const _kTextSecondary = Color(0xFFBDBDBD);
const _kTextMuted = Color(0xFF9E9E9E);
const _kDivider = Color(0xFF424242);
const _kOrange = Color(0xFFFF9800);

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _ruaController = TextEditingController();
  final _numeroController = TextEditingController();
  final _complementoController = TextEditingController();
  final _bairroSearchController = TextEditingController();
  bool _isLoading = false;
  
  NeighborhoodModel? _selectedNeighborhood;
  bool _isCustomNeighborhood = false;
  String _customBairroName = '';

  @override
  void dispose() {
    _ruaController.dispose();
    _numeroController.dispose();
    _complementoController.dispose();
    _bairroSearchController.dispose();
    super.dispose();
  }

  String _buildFullAddress() {
    final parts = <String>[];
    if (_ruaController.text.isNotEmpty) parts.add(_ruaController.text.trim());
    if (_numeroController.text.isNotEmpty) parts.add('Nº ${_numeroController.text.trim()}');
    
    final bairroName = _isCustomNeighborhood 
        ? _customBairroName 
        : _selectedNeighborhood?.name ?? '';
    if (bairroName.isNotEmpty) parts.add(bairroName);
    if (_complementoController.text.isNotEmpty) parts.add(_complementoController.text.trim());
    return parts.join(', ');
  }

  String _getTranslatedItemName(CartItemModel item, String Function(String) tr) {
    if (item.pizza != null) {
      String sizeName = item.pizza!.size == PizzaSize.large ? 'Grande' : 'Broto';
      final flavors = item.pizza!.selectedFlavors.values
          .whereType<FlavorModel>()
          .map((f) => tr(f.name))
          .join('/');
      return 'Pizza ${tr(sizeName)} ($flavors)';
    }
    if (item.menuItem != null) {
      return tr(item.menuItem!.name);
    }
    return item.displayName;
  }

  Future<void> _finalizeOrder(CartState cart) async {
    final t = ref.read(translationsProvider);

    if (cart.deliveryMethod == DeliveryMethod.delivery) {
      if (_ruaController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(t['checkout_fill_street']!),
            backgroundColor: _kAccent,
          ));
        return;
      }
      if (_numeroController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(t['checkout_fill_number']!),
            backgroundColor: _kAccent,
          ));
        return;
      }
      if (_selectedNeighborhood == null && !_isCustomNeighborhood) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(t['checkout_fill_neighborhood']!),
            backgroundColor: _kAccent,
          ));
        return;
      }
    }
    if (cart.paymentMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(t['checkout_fill_payment']!),
          backgroundColor: _kAccent,
        ));
      return;
    }

    setState(() => _isLoading = true);

    final customer = ref.read(customerProvider);

    StringBuffer msg = StringBuffer();
    msg.writeln("🍕 *Novo Pedido - Lucchese*");
    msg.writeln("📍 Tipo: ${cart.deliveryMethod == DeliveryMethod.delivery ? 'Entrega' : 'Retirada'}");
    
    if (customer != null) {
      msg.writeln("👤 Cliente: ${customer.name}");
      msg.writeln("📱 WhatsApp: ${customer.phone}");
    }
    
    if (cart.deliveryMethod == DeliveryMethod.delivery) {
      msg.writeln("🏠 Endereço: ${_buildFullAddress()}");
      
      if (_isCustomNeighborhood) {
        msg.writeln("");
        msg.writeln("⚠️ *ATENÇÃO: Bairro não cadastrado!*");
        msg.writeln("Bairro informado: $_customBairroName");
        msg.writeln("Verificar taxa de entrega manualmente com motoboy.");
      } else if (_selectedNeighborhood != null) {
        msg.writeln("📍 Bairro: ${_selectedNeighborhood!.name} (Taxa: R\$ ${_selectedNeighborhood!.deliveryFee.toStringAsFixed(2)})");
      }
    }

    msg.writeln("");
    msg.writeln("🛒 *Itens:*");
    for (var item in cart.items) {
      msg.writeln('${item.quantity}x ${item.displayName}');
      msg.writeln("   R\$ ${item.totalPrice.toStringAsFixed(2)}");
    }
    
    msg.writeln("");
    msg.writeln("💳 Pagamento: ${cart.paymentMethod!.label}");
    msg.writeln("--------------------------");
    if (cart.deliveryFee > 0) {
      msg.writeln("Subtotal: R\$ ${cart.subtotal.toStringAsFixed(2)}");
      msg.writeln("Entrega: R\$ ${cart.deliveryFee.toStringAsFixed(2)}");
    }
    msg.writeln("*TOTAL: R\$ ${cart.total.toStringAsFixed(2)}*");

    final url = Uri.parse("https://wa.me/5551997004458?text=${Uri.encodeComponent(msg.toString())}");
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
      ref.read(cartProvider.notifier).clearCart();
      if (mounted) {
        Navigator.pop(context);
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(t['checkout_whatsapp_fail']!)));
      }
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  InputDecoration _inputDecoration({
    required String label,
    String? hint,
    required IconData icon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: _kTextSecondary, fontSize: 14),
      hintStyle: const TextStyle(color: _kTextMuted, fontSize: 13),
      prefixIcon: Icon(icon, color: _kTextMuted, size: 20),
      filled: true,
      fillColor: _kSurface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _kDivider),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _kDivider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _kAccent, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final notifier = ref.read(cartProvider.notifier);
    final menuAsync = ref.watch(digitalMenuProvider);
    final t = ref.watch(translationsProvider);
    final tr = ref.watch(contentTranslatorProvider);

    String payLabel(PaymentMethod m) {
      switch (m) {
        case PaymentMethod.pix_online: return t['pay_pix']!;
        case PaymentMethod.credit_online: return t['pay_card']!;
        case PaymentMethod.money: return t['pay_money']!;
        case PaymentMethod.card_machine: return t['pay_machine']!;
      }
    }

    return Scaffold(
      backgroundColor: _kBgDark,
      appBar: AppBar(
        title: Text(
          t['checkout_title']!,
          style: const TextStyle(
            color: _kTextPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: _kCardDark,
        foregroundColor: _kTextPrimary,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: _kAccent))
        : SingleChildScrollView(
          child: Column(
            children: [
              // ─── Delivery / Pickup Toggle ───
              Container(
                padding: const EdgeInsets.all(16),
                color: _kCardDark,
                child: Row(
                  children: [
                    _buildToggleButton(
                      label: t['checkout_delivery']!,
                      icon: Icons.delivery_dining,
                      isSelected: cart.deliveryMethod == DeliveryMethod.delivery,
                      extraLabel: cart.deliveryFee > 0
                          ? ' (R\$ ${cart.deliveryFee.toStringAsFixed(2)})'
                          : null,
                      onTap: () => notifier.setDeliveryMethod(DeliveryMethod.delivery),
                    ),
                    const SizedBox(width: 12),
                    _buildToggleButton(
                      label: t['checkout_pickup']!,
                      icon: Icons.store,
                      isSelected: cart.deliveryMethod == DeliveryMethod.pickup,
                      onTap: () => notifier.setDeliveryMethod(DeliveryMethod.pickup),
                    ),
                  ],
                ),
              ),
              
              // ─── Address Section ───
              if (cart.deliveryMethod == DeliveryMethod.delivery)
                _buildAddressSection(menuAsync, t)
              else
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _kCardDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _kDivider),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: _kOrange.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.location_on, color: _kOrange, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t['checkout_pickup_at']!,
                              style: const TextStyle(
                                color: _kTextPrimary,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              t['checkout_pickup_address']!,
                              style: const TextStyle(color: _kTextSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // ─── Cart Items ───
              if (cart.items.isNotEmpty)
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: _kCardDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _kDivider),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, _) => const Divider(height: 1, color: _kDivider),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return ListTile(
                        title: Text(
                          _getTranslatedItemName(item, tr),
                          style: const TextStyle(
                            color: _kTextPrimary,
                            fontWeight: FontWeight.w500,
                            fontSize: 15,
                          ),
                        ),
                        subtitle: Text(
                          '${item.quantity}x  •  R\$ ${item.totalPrice.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: _kGreenBright,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: _kAccentLight, size: 22),
                          onPressed: () => notifier.removeItem(item),
                        ),
                      );
                    },
                  ),
                )
              else
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: _kCardDark,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.shopping_cart_outlined, size: 40, color: _kTextMuted),
                        const SizedBox(height: 8),
                        Text(
                          t['checkout_empty']!,
                          style: const TextStyle(color: _kTextMuted, fontSize: 15),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 16),

              // ─── Payment Methods ───
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _kCardDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _kDivider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t['checkout_payment']!,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: _kTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 14),
                    ..._buildPaymentGrid(cart, notifier, payLabel),
                  ],
                ),
              ),

              const SizedBox(height: 16),
              
              // ─── Totals Area ───
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: _kCardDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _kDivider),
                ),
                child: Column(
                  children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(t['checkout_subtotal']!, style: const TextStyle(color: _kTextSecondary, fontSize: 15)),
                      Text(
                        "R\$ ${cart.subtotal.toStringAsFixed(2)}",
                        style: const TextStyle(color: _kTextPrimary, fontSize: 15, fontWeight: FontWeight.w500),
                      ),
                    ]),
                    if (cart.deliveryMethod == DeliveryMethod.delivery) ...[
                      const SizedBox(height: 8),
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text(
                          _isCustomNeighborhood 
                            ? t['checkout_delivery_fee_confirm']!
                            : t['checkout_delivery_fee']!,
                          style: const TextStyle(color: _kTextSecondary, fontSize: 15),
                        ),
                        Text(
                          cart.deliveryFee > 0 
                            ? "R\$ ${cart.deliveryFee.toStringAsFixed(2)}"
                            : _isCustomNeighborhood ? t['checkout_delivery_fee_tbd']! : t['checkout_delivery_fee_select']!,
                          style: TextStyle(
                            color: _isCustomNeighborhood ? _kOrange : _kTextPrimary,
                            fontWeight: FontWeight.w500,
                            fontSize: 15,
                          ),
                        ),
                      ]),
                    ],
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(color: _kDivider, height: 1),
                    ),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text(t['checkout_total']!, style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: _kTextPrimary,
                      )),
                      Text(
                        "R\$ ${cart.total.toStringAsFixed(2)}", 
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: _kGreenBright,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: cart.items.isEmpty ? null : () => _finalizeOrder(cart),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: _kSurface,
                          disabledForegroundColor: _kTextMuted,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.chat, size: 22),
                              const SizedBox(width: 10),
                              Text(
                                t['checkout_finalize']!,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
    );
  }

  // ─── Toggle Button ───
  Widget _buildToggleButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    String? extraLabel,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? _kAccent : _kSurface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? _kAccentLight : _kDivider,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isSelected ? Icons.check_circle : icon,
                color: isSelected ? Colors.white : _kTextMuted,
                size: 20,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  '$label${extraLabel ?? ''}',
                  style: TextStyle(
                    color: isSelected ? Colors.white : _kTextPrimary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    fontSize: 14,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Payment Grid (2 columns, equal width) ───
  List<Widget> _buildPaymentGrid(CartState cart, CartNotifier notifier, String Function(PaymentMethod) payLabel) {
    final methods = PaymentMethod.values.where((m) {
      if (cart.deliveryMethod == DeliveryMethod.delivery && m == PaymentMethod.card_machine) return false;
      return true;
    }).toList();

    final rows = <Widget>[];
    for (int i = 0; i < methods.length; i += 2) {
      final first = methods[i];
      final second = (i + 1 < methods.length) ? methods[i + 1] : null;
      rows.add(
        Padding(
          padding: EdgeInsets.only(bottom: i + 2 < methods.length ? 10 : 0),
          child: Row(
            children: [
              Expanded(child: _buildPaymentChip(first, cart.paymentMethod == first, notifier, payLabel)),
              const SizedBox(width: 10),
              if (second != null)
                Expanded(child: _buildPaymentChip(second, cart.paymentMethod == second, notifier, payLabel))
              else
                const Expanded(child: SizedBox()),
            ],
          ),
        ),
      );
    }
    return rows;
  }

  Widget _buildPaymentChip(PaymentMethod method, bool isSelected, CartNotifier notifier, String Function(PaymentMethod) payLabel) {
    IconData icon;
    switch (method) {
      case PaymentMethod.pix_online:
        icon = Icons.qr_code;
        break;
      case PaymentMethod.credit_online:
        icon = Icons.credit_card;
        break;
      case PaymentMethod.money:
        icon = Icons.attach_money;
        break;
      case PaymentMethod.card_machine:
        icon = Icons.point_of_sale;
        break;
    }

    return GestureDetector(
      onTap: () => notifier.setPaymentMethod(method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? _kAccent : _kSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? _kAccentLight : _kDivider,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: isSelected ? Colors.white : _kTextMuted),
            const SizedBox(width: 8),
            Text(
              payLabel(method),
              style: TextStyle(
                color: isSelected ? Colors.white : _kTextPrimary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════
  // SEÇÃO DE ENDEREÇO
  // ═══════════════════════════════════════════════
  Widget _buildAddressSection(AsyncValue<dynamic> menuAsync, Map<String, String> t) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _kCardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _kAccent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.delivery_dining, color: _kAccentLight, size: 22),
              const SizedBox(width: 8),
              Text(
                t['checkout_address_title']!,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: _kTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // RUA
          TextField(
            controller: _ruaController,
            style: const TextStyle(color: _kTextPrimary, fontSize: 15),
            decoration: _inputDecoration(
              label: t['checkout_street']!,
              icon: Icons.edit_road,
            ),
          ),
          const SizedBox(height: 12),
          
          // NÚMERO + COMPLEMENTO
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _numeroController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: _kTextPrimary, fontSize: 15),
                  decoration: _inputDecoration(
                    label: t['checkout_number']!,
                    icon: Icons.pin,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _complementoController,
                  style: const TextStyle(color: _kTextPrimary, fontSize: 15),
                  decoration: _inputDecoration(
                    label: t['checkout_complement']!,
                    hint: t['checkout_complement_hint']!,
                    icon: Icons.apartment,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // BAIRRO
          _buildNeighborhoodSelector(menuAsync, t),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════
  // SELECTOR DE BAIRRO
  // ═══════════════════════════════════════════════
  Widget _buildNeighborhoodSelector(AsyncValue<dynamic> menuAsync, Map<String, String> t) {
    return menuAsync.when(
      loading: () => const LinearProgressIndicator(color: _kAccent),
      error: (e, _) => Text("Erro: $e", style: const TextStyle(color: _kAccentLight)),
      data: (menuData) {
        final neighborhoods = (menuData as dynamic).neighborhoods as List<NeighborhoodModel>;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Autocomplete<NeighborhoodModel>(
              optionsBuilder: (TextEditingValue textEditingValue) {
                if (textEditingValue.text.isEmpty) {
                  return neighborhoods;
                }
                final query = textEditingValue.text.toLowerCase();
                return neighborhoods.where(
                  (n) => n.name.toLowerCase().contains(query),
                );
              },
              displayStringForOption: (n) => "${n.name} (R\$ ${n.deliveryFee.toStringAsFixed(2)})",
              onSelected: (NeighborhoodModel neighborhood) {
                setState(() {
                  _selectedNeighborhood = neighborhood;
                  _isCustomNeighborhood = false;
                  _customBairroName = '';
                });
                ref.read(cartProvider.notifier).setNeighborhood(
                  neighborhood.name, neighborhood.deliveryFee);
              },
              fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
                _bairroSearchController.text;
                return TextField(
                  controller: controller,
                  focusNode: focusNode,
                  style: const TextStyle(color: _kTextPrimary, fontSize: 15),
                  decoration: _inputDecoration(
                    label: t['checkout_neighborhood']!,
                    icon: Icons.location_city,
                  ).copyWith(
                    suffixIcon: _selectedNeighborhood != null 
                      ? const Icon(Icons.check_circle, color: _kGreen)
                      : _isCustomNeighborhood
                        ? const Icon(Icons.warning_amber, color: _kOrange)
                        : null,
                  ),
                  onChanged: (value) {
                    final query = value.toLowerCase().trim();
                    final matches = neighborhoods.where(
                      (n) => n.name.toLowerCase().contains(query),
                    );
                    
                    if (value.isNotEmpty && matches.isEmpty) {
                      setState(() {
                        _isCustomNeighborhood = true;
                        _customBairroName = value.trim();
                        _selectedNeighborhood = null;
                      });
                      ref.read(cartProvider.notifier).clearNeighborhood();
                    } else if (_isCustomNeighborhood && matches.isNotEmpty) {
                      setState(() {
                        _isCustomNeighborhood = false;
                        _customBairroName = '';
                      });
                    }
                  },
                );
              },
              optionsViewBuilder: (context, onSelected, options) {
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    elevation: 8,
                    color: _kCardDark,
                    borderRadius: BorderRadius.circular(12),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 200, maxWidth: 360),
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        itemCount: options.length,
                        itemBuilder: (context, index) {
                          final n = options.elementAt(index);
                          return ListTile(
                            dense: true,
                            title: Text(
                              n.name,
                              style: const TextStyle(color: _kTextPrimary, fontWeight: FontWeight.w500),
                            ),
                            trailing: Text(
                              "R\$ ${n.deliveryFee.toStringAsFixed(2)}",
                              style: const TextStyle(
                                fontWeight: FontWeight.bold, 
                                color: _kGreenBright,
                                fontSize: 14,
                              ),
                            ),
                            onTap: () => onSelected(n),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
            
            // Status do bairro
            if (_selectedNeighborhood != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _kGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _kGreen.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, size: 18, color: _kGreenBright),
                      const SizedBox(width: 8),
                      Text(
                        "${_selectedNeighborhood!.name} — R\$ ${_selectedNeighborhood!.deliveryFee.toStringAsFixed(2)}",
                        style: const TextStyle(fontSize: 14, color: _kGreenBright, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
              
            if (_isCustomNeighborhood)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _kOrange.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _kOrange.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber, size: 20, color: _kOrange),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          t['checkout_neighborhood_warn']!,
                          style: const TextStyle(fontSize: 13, color: _kOrange, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
