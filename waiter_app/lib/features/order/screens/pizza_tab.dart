import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../menu/providers/menu_provider.dart';
import '../../menu/models/pizza_size_model.dart';
import '../../menu/models/pizza_flavor_model.dart';
import '../providers/order_provider.dart';

class PizzaTab extends StatefulWidget {
  const PizzaTab({super.key});

  @override
  State<PizzaTab> createState() => _PizzaTabState();
}

class _PizzaTabState extends State<PizzaTab> with AutomaticKeepAliveClientMixin {
  PizzaSizeModel? _selectedSize;
  final List<PizzaFlavorModel> _selectedFlavors = [];
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  String _selectedBorder = '';
  String _searchQuery = '';

  @override
  void dispose() {
    _notesController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  bool get wantKeepAlive => true;

  void _onSizeSelected(PizzaSizeModel size) {
    setState(() {
      _selectedSize = size;
      _selectedFlavors.clear();
      _selectedBorder = '';
    });
  }

  bool _isComboFlavor(PizzaFlavorModel flavor) {
    return flavor.name.toLowerCase().contains('do dia');
  }

  bool get _hasComboSelected => _selectedFlavors.any((f) => _isComboFlavor(f));

  void _onFlavorToggle(PizzaFlavorModel flavor) {
    setState(() {
      if (_selectedFlavors.any((f) => f.id == flavor.id)) {
        // Deselecting
        _selectedFlavors.removeWhere((f) => f.id == flavor.id);
      } else {
        if (_isComboFlavor(flavor)) {
          // Selecting a combo flavor: clear all others, only keep combo
          _selectedFlavors.clear();
          _selectedFlavors.add(flavor);
        } else {
          // Selecting a regular flavor
          if (_hasComboSelected) {
            // Remove combo first
            _selectedFlavors.removeWhere((f) => _isComboFlavor(f));
          }
          if (_selectedSize != null &&
              _selectedFlavors.length < _selectedSize!.maxFlavors) {
            _selectedFlavors.add(flavor);
          }
        }
      }
    });
  }

  void _addToCart() {
    if (_selectedSize != null && _selectedFlavors.isNotEmpty) {
      Provider.of<OrderProvider>(context, listen: false).addPizza(
        _selectedSize!,
        List.from(_selectedFlavors),
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        border: _selectedBorder.isNotEmpty ? _selectedBorder : null,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pizza adicionada ao carrinho!')),
      );

      setState(() {
        _selectedFlavors.clear();
        _notesController.clear();
        _searchController.clear();
        _searchQuery = '';
        _selectedBorder = '';
      });
    }
  }

  List<PizzaFlavorModel> _getFilteredFlavors(List<PizzaFlavorModel> allFlavors) {
    var filtered = allFlavors.toList();
    
    // Hide combo flavors (Do Dia) for Broto size
    if (_selectedSize != null && _selectedSize!.isSpecialBrotoRule) {
      filtered = filtered.where((f) => !_isComboFlavor(f)).toList();
    }
    
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((f) => f.name.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final menuProvider = Provider.of<MenuProvider>(context);
    final canHaveBorder = _selectedSize != null && !_selectedSize!.isSpecialBrotoRule;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // === COMPACT TOP BAR: Size + Border ===
        Container(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            border: Border(bottom: BorderSide(color: Colors.grey.shade800)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Size Selection - inline toggle
              Row(
                children: [
                  const Text(
                    'Tamanho:',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: menuProvider.pizzaSizes.map((size) {
                          final isSelected = size.id == _selectedSize?.id;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: GestureDetector(
                              onTap: () => _onSizeSelected(size),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.deepOrange : const Color(0xFF2A2A3E),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? Colors.deepOrange : Colors.grey.shade700,
                                  ),
                                ),
                                child: Text(
                                  '${size.name} (${size.slices} fat.)',
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Colors.grey.shade300,
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  if (_selectedSize != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: Text(
                        _hasComboSelected
                            ? '✓ Combo'
                            : '${_selectedFlavors.length}/${_selectedSize!.maxFlavors}',
                        style: TextStyle(
                          color: (_hasComboSelected || _selectedFlavors.length == _selectedSize!.maxFlavors)
                              ? Colors.deepOrange
                              : Colors.grey.shade500,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),

              // Border Selection - only for Grande, inline small chips
              if (canHaveBorder) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text(
                      'Borda:',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: OrderItem.borderOptions.entries.map((entry) {
                            final isSelected = _selectedBorder == entry.key;
                            return Padding(
                              padding: const EdgeInsets.only(right: 4),
                              child: GestureDetector(
                                onTap: () => setState(() => _selectedBorder = entry.key),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isSelected ? Colors.deepOrange : const Color(0xFF2A2A3E),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected ? Colors.deepOrange : Colors.grey.shade700,
                                    ),
                                  ),
                                  child: Text(
                                    entry.key.isEmpty ? 'Sem' : entry.value,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : Colors.grey.shade400,
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Text(
                        '+R\$ 20',
                        style: TextStyle(
                          color: _selectedBorder.isNotEmpty ? Colors.deepOrange : Colors.grey.shade600,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),

        // === SEARCH BAR ===
        if (_selectedSize != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: const Color(0xFF1E1E2E),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _searchQuery = value),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Buscar sabor...',
                hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                prefixIcon: Icon(Icons.search, color: Colors.grey.shade500, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                        child: Icon(Icons.close, color: Colors.grey.shade500, size: 18),
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFF2A2A3E),
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

        // === FLAVORS LIST - Maximum space ===
        Expanded(
          child: _selectedSize == null
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.local_pizza_outlined, size: 48, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('Selecione um tamanho', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : _buildFlavorList(menuProvider.pizzaFlavors),
        ),

        // === BOTTOM BAR: Notes + Add button ===
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            border: Border(top: BorderSide(color: Colors.grey.shade800)),
          ),
          child: Column(
            children: [
              // Selected flavors preview
              if (_selectedFlavors.isNotEmpty)
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: _selectedFlavors.map((f) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.deepOrange.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.deepOrange.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              f.name,
                              style: const TextStyle(color: Colors.deepOrange, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () => _onFlavorToggle(f),
                              child: const Icon(Icons.close, size: 14, color: Colors.deepOrange),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),

              // Notes field - compact
              TextField(
                controller: _notesController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Observações (opcional)',
                  hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  prefixIcon: Icon(Icons.note_alt_outlined, color: Colors.grey.shade600, size: 18),
                  filled: true,
                  fillColor: const Color(0xFF2A2A3E),
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 1,
              ),
              const SizedBox(height: 8),

              // Add button
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: (_selectedSize != null && _selectedFlavors.isNotEmpty)
                      ? _addToCart
                      : null,
                  icon: const Icon(Icons.add_shopping_cart, size: 18),
                  label: Text(
                    _selectedFlavors.isEmpty
                        ? 'Selecione sabor(es)'
                        : 'Adicionar ao Carrinho',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    backgroundColor: Colors.deepOrange,
                    disabledBackgroundColor: Colors.grey.shade800,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFlavorList(List<PizzaFlavorModel> allFlavors) {
    final flavors = _getFilteredFlavors(allFlavors);

    if (flavors.isEmpty) {
      return Center(
        child: Text(
          'Nenhum sabor encontrado',
          style: TextStyle(color: Colors.grey.shade500),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      itemCount: flavors.length,
      itemBuilder: (context, index) {
        final flavor = flavors[index];
        final isSelected = _selectedFlavors.any((f) => f.id == flavor.id);
        // Disable if: combo is selected and this isn't the combo, OR max reached and not selected
        final isDisabled = !isSelected && 
            (_hasComboSelected || _selectedFlavors.length >= _selectedSize!.maxFlavors);

        return GestureDetector(
          onTap: isDisabled ? null : () => _onFlavorToggle(flavor),
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 2),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected
                  ? Colors.deepOrange.withValues(alpha: 0.15)
                  : isDisabled
                      ? Colors.transparent
                      : const Color(0xFF222236),
              borderRadius: BorderRadius.circular(8),
              border: isSelected
                  ? Border.all(color: Colors.deepOrange, width: 1.5)
                  : null,
            ),
            child: Row(
              children: [
                // Check icon
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? Colors.deepOrange : Colors.transparent,
                    border: Border.all(
                      color: isSelected
                          ? Colors.deepOrange
                          : isDisabled
                              ? Colors.grey.shade800
                              : Colors.grey.shade600,
                      width: 1.5,
                    ),
                  ),
                  child: isSelected
                      ? const Icon(Icons.check, size: 14, color: Colors.white)
                      : null,
                ),
                const SizedBox(width: 12),
                // Name + description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        flavor.name,
                        style: TextStyle(
                          color: isSelected
                              ? Colors.deepOrange
                              : isDisabled
                                  ? Colors.grey.shade700
                                  : Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      if (flavor.description != null && flavor.description!.isNotEmpty)
                        Text(
                          flavor.description!,
                          style: TextStyle(
                            color: isDisabled ? Colors.grey.shade800 : Colors.grey.shade500,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                // Price
                Text(
                  'R\$ ${flavor.basePrice.toStringAsFixed(0)}',
                  style: TextStyle(
                    color: isSelected
                        ? Colors.deepOrange
                        : isDisabled
                            ? Colors.grey.shade700
                            : Colors.grey.shade400,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
