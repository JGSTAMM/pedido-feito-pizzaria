import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

/// Idiomas suportados
enum AppLocale { pt, es }

/// Provider global de idioma
final localeProvider = StateProvider<AppLocale>((ref) => AppLocale.pt);

/// Mapa de traduções PT / ES
/// Uso: final t = ref.watch(translationsProvider);
///      Text(t['menu_title']!)
final translationsProvider = Provider<Map<String, String>>((ref) {
  final locale = ref.watch(localeProvider);
  return locale == AppLocale.es ? _es : _pt;
});

// ═══════════════════════════════════════════════════════
// PORTUGUÊS
// ═══════════════════════════════════════════════════════
const _pt = <String, String>{
  // Welcome
  'welcome_title': 'Bem-vindo à',
  'welcome_subtitle': 'Lucchese Pizzaria',
  'welcome_tagline': 'As melhores pizzas da cidade!',
  'welcome_select_lang': 'Escolha o idioma',
  'welcome_btn_pt': '🇧🇷  Português',
  'welcome_btn_es': '🇦🇷  Español',
  'welcome_enter': 'ENTRAR NO CARDÁPIO',
  'welcome_open': 'Aberto agora',
  'welcome_closed': 'Fechado',

  // Menu
  'menu_title': 'Cardápio',
  'menu_loading': 'Carregando cardápio...',
  'menu_error': 'Erro ao carregar cardápio',
  'menu_retry': 'Tentar novamente',
  'menu_most_ordered': '🍕 Os mais pedidos',
  'menu_build_pizza': 'MONTAR MINHA PIZZA',
  'menu_from': 'a partir de',
  'menu_nav_home': 'Início',
  'menu_nav_orders': 'Pedidos',
  'menu_nav_cart': 'Carrinho',
  'menu_open_hours': 'Aberto • Fecha às 23:00',
  'menu_drinks': 'Bebidas',
  'menu_extras': 'Extras',
  'menu_pizzas': 'Pizzas',

  // Pizza Builder
  'builder_title': 'Montar Pizza',
  'builder_broto': 'Broto',
  'builder_grande': 'Grande',
  'builder_flavors': 'Sabores:',
  'builder_final_price': 'Preço Final',
  'builder_add': 'ADICIONAR',
  'builder_added': 'Pizza adicionada ao carrinho!',
  'builder_go_cart': 'IR PARA O CARRINHO',

  // Flavor Selection
  'flavor_title': 'Escolha um Sabor',
  'flavor_search': 'Buscar sabor...',
  'flavor_not_found': 'Nenhum sabor encontrado para',
  'flavor_broto_rule': 'Broto: (valor / 2) + R\$ 5,00',
  'flavor_grande_ref': 'grande:',
  'flavor_tap_choose': 'Toque para\nescolher sabor',
  'flavor_none': 'Nenhum sabor disponível',

  // Customer Identification
  'identify_title': 'Identifique-se',
  'identify_whatsapp': 'WhatsApp',
  'identify_whatsapp_hint': '(99) 99999-9999',
  'identify_name': 'Nome e Sobrenome',
  'identify_name_hint': 'Seu nome completo',
  'identify_next': 'AVANÇAR',
  'identify_privacy': 'Seus dados são usados apenas para este pedido.',

  // Checkout
  'checkout_title': 'Checkout',
  'checkout_delivery': 'Entrega',
  'checkout_pickup': 'Retirada',
  'checkout_pickup_at': 'Retirar em:',
  'checkout_pickup_address': 'Rua da Pizzaria Lucchese, 123 - Centro',
  'checkout_address_title': 'Endereço de Entrega',
  'checkout_street': 'Rua / Avenida',
  'checkout_number': 'Número',
  'checkout_complement': 'Complemento',
  'checkout_complement_hint': 'Ap 111, Casa...',
  'checkout_neighborhood': 'Bairro',
  'checkout_neighborhood_warn': 'Bairro não cadastrado. A taxa de entrega será confirmada pelo motoboy via WhatsApp.',
  'checkout_payment': 'Forma de Pagamento',
  'checkout_subtotal': 'Subtotal',
  'checkout_delivery_fee': 'Taxa de Entrega',
  'checkout_delivery_fee_confirm': 'Taxa de Entrega (a confirmar)',
  'checkout_delivery_fee_tbd': 'A definir',
  'checkout_delivery_fee_select': 'Selecione o bairro',
  'checkout_total': 'TOTAL',
  'checkout_finalize': 'FINALIZAR PEDIDO (WhatsApp)',
  'checkout_empty': 'Carrinho vazio',
  'checkout_fill_street': 'Informe a rua',
  'checkout_fill_number': 'Informe o número',
  'checkout_fill_neighborhood': 'Selecione o bairro',
  'checkout_fill_payment': 'Selecione a forma de pagamento',
  'checkout_whatsapp_fail': 'Não foi possível abrir o WhatsApp',

  // Payment
  'pay_pix': 'Pix Online',
  'pay_card': 'Cartão (Online)',
  'pay_money': 'Dinheiro',
  'pay_machine': 'Maquininha',
};

// ═══════════════════════════════════════════════════════
// ESPAÑOL
// ═══════════════════════════════════════════════════════
const _es = <String, String>{
  // Welcome
  'welcome_title': 'Bienvenido a',
  'welcome_subtitle': 'Lucchese Pizzería',
  'welcome_tagline': '¡Las mejores pizzas de la ciudad!',
  'welcome_select_lang': 'Elige el idioma',
  'welcome_btn_pt': '🇧🇷  Português',
  'welcome_btn_es': '🇦🇷  Español',
  'welcome_enter': 'ENTRAR AL MENÚ',
  'welcome_open': 'Abierto ahora',
  'welcome_closed': 'Cerrado',

  // Menu
  'menu_title': 'Menú',
  'menu_loading': 'Cargando menú...',
  'menu_error': 'Error al cargar el menú',
  'menu_retry': 'Intentar de nuevo',
  'menu_most_ordered': '🍕 Los más pedidos',
  'menu_build_pizza': 'ARMAR MI PIZZA',
  'menu_from': 'desde',
  'menu_nav_home': 'Inicio',
  'menu_nav_orders': 'Pedidos',
  'menu_nav_cart': 'Carrito',
  'menu_open_hours': 'Abierto • Cierra a las 23:00',
  'menu_drinks': 'Bebidas',
  'menu_extras': 'Extras',
  'menu_pizzas': 'Pizzas',

  // Pizza Builder
  'builder_title': 'Armar Pizza',
  'builder_broto': 'Media',
  'builder_grande': 'Grande',
  'builder_flavors': 'Sabores:',
  'builder_final_price': 'Precio Final',
  'builder_add': 'AGREGAR',
  'builder_added': '¡Pizza agregada al carrito!',
  'builder_go_cart': 'IR AL CARRITO',

  // Flavor Selection
  'flavor_title': 'Elige un Sabor',
  'flavor_search': 'Buscar sabor...',
  'flavor_not_found': 'Ningún sabor encontrado para',
  'flavor_broto_rule': 'Media: (valor / 2) + R\$ 5,00',
  'flavor_grande_ref': 'grande:',
  'flavor_tap_choose': 'Toca para\nelegir sabor',
  'flavor_none': 'No hay sabores disponibles',

  // Customer Identification
  'identify_title': 'Identifícate',
  'identify_whatsapp': 'WhatsApp',
  'identify_whatsapp_hint': '(99) 99999-9999',
  'identify_name': 'Nombre y Apellido',
  'identify_name_hint': 'Tu nombre completo',
  'identify_next': 'AVANZAR',
  'identify_privacy': 'Tus datos se usan solo para este pedido.',

  // Checkout
  'checkout_title': 'Finalizar',
  'checkout_delivery': 'Delivery',
  'checkout_pickup': 'Retiro',
  'checkout_pickup_at': 'Retirar en:',
  'checkout_pickup_address': 'Rua da Pizzaria Lucchese, 123 - Centro',
  'checkout_address_title': 'Dirección de Entrega',
  'checkout_street': 'Calle / Avenida',
  'checkout_number': 'Número',
  'checkout_complement': 'Complemento',
  'checkout_complement_hint': 'Depto 111, Casa...',
  'checkout_neighborhood': 'Barrio',
  'checkout_neighborhood_warn': 'Barrio no registrado. La tarifa de envío será confirmada por el repartidor vía WhatsApp.',
  'checkout_payment': 'Forma de Pago',
  'checkout_subtotal': 'Subtotal',
  'checkout_delivery_fee': 'Tarifa de Envío',
  'checkout_delivery_fee_confirm': 'Tarifa de Envío (a confirmar)',
  'checkout_delivery_fee_tbd': 'A definir',
  'checkout_delivery_fee_select': 'Selecciona el barrio',
  'checkout_total': 'TOTAL',
  'checkout_finalize': 'FINALIZAR PEDIDO (WhatsApp)',
  'checkout_empty': 'Carrito vacío',
  'checkout_fill_street': 'Ingresa la calle',
  'checkout_fill_number': 'Ingresa el número',
  'checkout_fill_neighborhood': 'Selecciona el barrio',
  'checkout_fill_payment': 'Selecciona la forma de pago',
  'checkout_whatsapp_fail': 'No se pudo abrir WhatsApp',

  // Payment
  'pay_pix': 'Pix Online',
  'pay_card': 'Tarjeta (Online)',
  'pay_money': 'Efectivo',
  'pay_machine': 'Maquinita',
};
