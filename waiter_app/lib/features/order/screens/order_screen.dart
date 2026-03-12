import 'package:flutter/material.dart';
import '../../menu/models/table_model.dart';
import 'pizza_tab.dart';
import 'product_tab.dart';
import 'cart_tab.dart';

class OrderScreen extends StatefulWidget {
  final TableModel table;

  const OrderScreen({super.key, required this.table});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.table.name),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Pizzas'),
              Tab(text: 'Bebidas/Produtos'),
              Tab(text: 'Carrinho'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            const PizzaTab(),
            const ProductTab(),
            CartTab(
              tableId: widget.table.id,
              onSuccess: () {
                Navigator.pop(context); // Go back to tables
              },
            ),
          ],
        ),
      ),
    );
  }
}
