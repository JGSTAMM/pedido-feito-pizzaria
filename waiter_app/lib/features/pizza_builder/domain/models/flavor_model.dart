
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class FlavorModel extends Equatable {
  final String id;
  final String name;
  final double priceLarge; // Preço se for inteira Grande
  final String? imageAsset;
  final Color? color; // Fallback se não tiver imagem
  final List<String> ingredients;

  const FlavorModel({
    required this.id,
    required this.name,
    required this.priceLarge,
    this.imageAsset,
    this.color,
    this.ingredients = const [],
  });

  @override
  List<Object?> get props => [id, name, priceLarge, imageAsset, color, ingredients];
}
