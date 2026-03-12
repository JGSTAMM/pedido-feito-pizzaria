import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_translations.dart';

/// Traduz conteúdo dinâmico (nomes vindos do banco) conforme o idioma ativo.
/// Se o idioma for PT ou não houver tradução, retorna o texto original.
String translateContent(String ptText, AppLocale locale) {
  if (locale == AppLocale.pt) return ptText;
  return _contentEs[ptText] ?? ptText;
}

/// Provider que retorna uma função de tradução de conteúdo já vinculada ao idioma ativo.
/// Uso: final tr = ref.watch(contentTranslatorProvider);
///      Text(tr(flavor.name))
final contentTranslatorProvider = Provider<String Function(String)>((ref) {
  final locale = ref.watch(localeProvider);
  return (String text) => translateContent(text, locale);
});

// ═══════════════════════════════════════════════════════════
// DICIONÁRIO DE CONTEÚDO  PT → ES
// ═══════════════════════════════════════════════════════════

const _contentEs = <String, String>{
  // ── Tamanhos de pizza ──
  'Broto': 'Media',
  'Grande': 'Grande',

  // ── SABORES SALGADOS ──
  'Mussarela': 'Mozzarella',
  'Bacon': 'Bacon',
  'Calabresa': 'Calabresa',
  'Vegetariana': 'Vegetariana',
  'Palmito': 'Palmito',
  'Alho': 'Ajo',
  'Marguerita': 'Margarita',
  'Milho': 'Choclo',
  'Napolitana': 'Napolitana',
  'Portuguesa': 'Portuguesa',
  'Atum': 'Atún',
  'Champignon': 'Champiñón',
  'Lombo': 'Lomo',
  'Quatro Queijos': 'Cuatro Quesos',
  'Cinco Queijos': 'Cinco Quesos',
  'Quatro Queijos com Bacon': 'Cuatro Quesos con Bacon',
  'Salame': 'Salame',
  'Tomate Seco': 'Tomate Seco',
  'Toscana': 'Toscana',
  'Brócolis': 'Brócoli',
  'Frango com Catupiry': 'Pollo con Catupiry',
  'Frango Especial': 'Pollo Especial',
  'Putanesca': 'Putanesca',
  'Strogonoff de Carne': 'Strogonoff de Carne',
  'Strogonoff de Frango': 'Strogonoff de Pollo',
  'Lombo com Abacaxi': 'Lomo con Ananá',
  'Coração': 'Corazón',
  'Pepperoni': 'Pepperoni',
  'Siciliana': 'Siciliana',
  'Filé': 'Filet',
  'Filé com Gorgonzola': 'Filet con Gorgonzola',
  'Filé com Cebola': 'Filet con Cebolla',
  'Filé com Alho': 'Filet con Ajo',
  'Siri': 'Cangrejo',
  'Camarão': 'Camarón',
  'Camarão ao 4 Queijos': 'Camarón a los 4 Quesos',

  // ── SABORES DOCES ──
  'Chocolate Preto': 'Chocolate Negro',
  'Chocolate Branco': 'Chocolate Blanco',
  'Chocolate Preto e Branco': 'Chocolate Negro y Blanco',
  'Chocolate Preto com Morango': 'Chocolate Negro con Fresa',
  'Chocolate Branco com Morango': 'Chocolate Blanco con Fresa',
  'Chocolate Preto com Paçoca': 'Chocolate Negro con Paçoca',
  'Chocolate Branco com Paçoca': 'Chocolate Blanco con Paçoca',
  'Chocolate Preto com Confete': 'Chocolate Negro con Confites',
  'Chocolate Branco com Confete': 'Chocolate Blanco con Confites',
  'Floresta Negra': 'Selva Negra',
  // Nota: Em espanhol (especialmente Argentina/Uruguai), 'Ananá' refere-se ao Abacaxi.
  // 'Banana' é traduzida como 'Banana' (ou Plátano), mas mantivemos 'Banana'.
  'Banana com Doce de Leite': 'Banana con Dulce de Leche',
  'Chocolate Preto com Abacaxi': 'Chocolate Negro con Ananá',
  'Chocolate Branco com Abacaxi': 'Chocolate Blanco con Ananá',

  // ── DESCRIÇÕES / INGREDIENTES ──
  'Mussarela e orégano': 'Mozzarella y orégano',
  'Bacon e orégano': 'Bacon y orégano',
  'Calabresa e orégano (cebola opcional)': 'Calabresa y orégano (cebolla opcional)',
  'Palmito, milho, ervilha e orégano': 'Palmito, choclo, arvejas y orégano',
  'Palmito e orégano': 'Palmito y orégano',
  'Alho no azeite de oliva e orégano': 'Ajo en aceite de oliva y orégano',
  'Tomate e manjericão': 'Tomate y albahaca',
  'Milho e orégano': 'Choclo y orégano',
  'Tomate, presunto, parmesão e orégano': 'Tomate, jamón, parmesano y orégano',
  'Presunto, ovos, azeitona verde, pimentões coloridos e orégano': 'Jamón, huevos, aceitunas verdes, morrones y orégano',
  'Atum e orégano (cebola opcional)': 'Atún y orégano (cebolla opcional)',
  'Champignon puxado na manteiga e orégano': 'Champiñones salteados en manteca y orégano',
  'Lombo canadense e orégano': 'Lomo canadiense y orégano',
  'Provolone, gorgonzola, catupiry e orégano': 'Provolone, gorgonzola, catupiry y orégano',
  'Provolone, gorgonzola, catupiry, cheddar e orégano': 'Provolone, gorgonzola, catupiry, cheddar y orégano',
  'Provolone, gorgonzola, catupiry, bacon e orégano': 'Provolone, gorgonzola, catupiry, bacon y orégano',
  'Salame italiano, pimentões coloridos e orégano': 'Salame italiano, morrones y orégano',
  'Tomate seco, orégano e rúcula': 'Tomate seco, orégano y rúcula',
  'Calabresa ralada, ovos, azeitona verde, pimentões coloridos e orégano': 'Calabresa rallada, huevos, aceitunas verdes, morrones y orégano',
  'Brócolis puxado na manteiga e orégano': 'Brócoli salteado en manteca y orégano',
  'Frango ralado, catupiry e orégano': 'Pollo desmenuzado, catupiry y orégano',
  'Frango ralado, bacon, milho, catupiry e orégano': 'Pollo desmenuzado, bacon, choclo, catupiry y orégano',
  'Atum, alcaparras, azeitona verde, azeitona preta e orégano': 'Atún, alcaparras, aceitunas verdes, aceitunas negras y orégano',
  'Strogonoff de carne e orégano': 'Strogonoff de carne y orégano',
  'Strogonoff de frango e orégano': 'Strogonoff de pollo y orégano',
  'Lombo canadense, abacaxi e orégano': 'Lomo canadiense, ananá y orégano',
  'Coração com especiarias e orégano': 'Corazón con especias y orégano',
  'Pepperoni e orégano': 'Pepperoni y orégano',
  'Bacon, tomate, champignon, cebola caramelizada e orégano': 'Bacon, tomate, champiñones, cebolla caramelizada y orégano',
  'Filé puxado na manteiga e orégano': 'Filet salteado en manteca y orégano',
  'Filé puxado na manteiga, gorgonzola e orégano': 'Filet salteado en manteca, gorgonzola y orégano',
  'Filé puxado na manteiga, cebola caramelizada e orégano': 'Filet salteado en manteca, cebolla caramelizada y orégano',
  'Filé puxado na manteiga, alho e orégano': 'Filet salteado en manteca, ajo y orégano',
  'Siri com especiarias e manjericão': 'Cangrejo con especias y albahaca',
  'Camarão com especiarias e manjericão': 'Camarón con especias y albahaca',
  'Provolone, gorgonzola, catupiry, camarão com especiarias e manjericão': 'Provolone, gorgonzola, catupiry, camarón con especias y albahaca',

  // Doces — descrições
  'Chocolate preto': 'Chocolate negro',
  'Chocolate branco': 'Chocolate blanco',
  'Chocolate preto e chocolate branco': 'Chocolate negro y chocolate blanco',
  'Chocolate preto e morango': 'Chocolate negro y fresa',
  'Chocolate branco e morango': 'Chocolate blanco y fresa',
  'Chocolate preto e paçoca': 'Chocolate negro y paçoca',
  'Chocolate branco e paçoca': 'Chocolate blanco y paçoca',
  'Chocolate preto e confete colorido': 'Chocolate negro y confites de colores',
  'Chocolate branco e confete colorido': 'Chocolate blanco y confites de colores',
  'Chocolate preto, chocolate branco e cereja': 'Chocolate negro, chocolate blanco y cereza',
  'Banana, doce de leite, mussarela e canela': 'Banana, dulce de leche, mozzarella y canela',
  'Chocolate preto e abacaxi': 'Chocolate negro y ananá',
  'Chocolate branco com abacaxi': 'Chocolate blanco con ananá',

  // ── PRODUTOS: EXTRAS ──
  'Pizza do Dia (Calabresa, Mussarela e Frango c/ Catupiry)': 'Pizza del Día (Calabresa, Mozzarella y Pollo c/ Catupiry)',
  'Borda Recheada - Cheddar': 'Borde Relleno - Cheddar',
  'Borda Recheada - Catupiry': 'Borde Relleno - Catupiry',
  'Borda Recheada - Chocolate com Avelã': 'Borde Relleno - Chocolate con Avellana',

  // ── PRODUTOS: BEBIDAS ──
  'Água com/sem Gás': 'Agua con/sin Gas',
  'Refrigerante Lata': 'Gaseosa Lata',
  'Refrigerante 600ml': 'Gaseosa 600ml',
  'Refrigerante 2L': 'Gaseosa 2L',
  'Suco Lata': 'Jugo Lata',
  'Suco Integral': 'Jugo Integral',
  'Cerveja Lata': 'Cerveza Lata',
  'Cerveja Latão': 'Cerveza Latón',
  'Cerveja 600ml': 'Cerveza 600ml',
  'Cerveja Long Neck': 'Cerveza Long Neck',
  'Cerveja Artesanal': 'Cerveza Artesanal',

  // ── CATEGORIAS ──
  'Bebidas': 'Bebidas',
  'Extras': 'Extras',
};
