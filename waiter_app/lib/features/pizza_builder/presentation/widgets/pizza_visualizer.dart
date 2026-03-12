
import 'dart:math';
import 'package:flutter/material.dart';
import '../../domain/models/pizza_model.dart';

class PizzaVisualizer extends StatelessWidget {
  final PizzaModel pizza;
  final Function(int) onSliceTap;
  final String emptySliceText;

  const PizzaVisualizer({
    super.key,
    required this.pizza,
    required this.onSliceTap,
    this.emptySliceText = 'Toque para\nescolher sabor',
  });

  @override
  Widget build(BuildContext context) {
    final isBroto = pizza.size == PizzaSize.broto;

    return AspectRatio(
      aspectRatio: isBroto ? 0.65 : 1.0, // Broto vertical (mais alto que largo)
      child: LayoutBuilder(
        builder: (context, constraints) {
          return CustomPaint(
            size: Size(constraints.maxWidth, constraints.maxHeight),
            painter: PizzaPainter(pizza: pizza, emptySliceText: emptySliceText),
            child: GestureDetector(
              onTapUp: (details) {
                final RenderBox box = context.findRenderObject() as RenderBox;
                final Offset localOffset = box.globalToLocal(details.globalPosition);
                
                if (isBroto) {
                  onSliceTap(0);
                } else {
                  final Offset center = Offset(box.size.width / 2, box.size.height / 2);
                  double angle = atan2(localOffset.dy - center.dy, localOffset.dx - center.dx);
                  if (angle < 0) angle += 2 * pi;
                  
                  int sliceIndex = 0;
                  int slices = pizza.activeSlices;

                  if (slices == 1) {
                    sliceIndex = 0;
                  } else if (slices == 2) {
                    if (angle < pi) {
                      sliceIndex = 0;
                    } else {
                      sliceIndex = 1;
                    }
                  } else if (slices == 3) {
                    double segment = (2 * pi) / 3;
                    if (angle < segment) {
                      sliceIndex = 0;
                    } else if (angle < 2 * segment) {
                      sliceIndex = 1;
                    } else {
                      sliceIndex = 2;
                    }
                  }
                  
                  onSliceTap(sliceIndex);
                }
              },
            ),
          );
        },
      ),
    );
  }
}

class PizzaPainter extends CustomPainter {
  final PizzaModel pizza;
  final String emptySliceText;

  PizzaPainter({required this.pizza, required this.emptySliceText});

  @override
  void paint(Canvas canvas, Size size) {
    if (pizza.size == PizzaSize.broto) {
      _paintBroto(canvas, size);
    } else {
      _paintGrande(canvas, size);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BROTO: Semicírculo VERTICAL (de pé) — corte reto à esquerda
  // Parece um "D" — lado reto vertical, arco para a direita
  // ═══════════════════════════════════════════════════════════
  void _paintBroto(Canvas canvas, Size size) {
    final centerY = size.height * 0.45; // Alinhar mais para cima
    final radius = min(size.width * 0.8, size.height * 0.42);
    final centerX = size.width / 2 - radius * 0.1; // Centro ligeiramente à esquerda
    final center = Offset(centerX, centerY);

    // Crust (semicírculo externo — arco da direita)
    final crustPaint = Paint()..color = const Color(0xFFEBCBAE);
    final crustPath = Path()
      ..moveTo(centerX, centerY - radius) // Topo
      ..arcTo(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2, // Começa no topo (270° = -90°)
        pi, // Varre 180° no sentido horário (topo → direita → baixo)
        false,
      )
      ..close(); // Fecha com linha reta vertical (corte)
    canvas.drawPath(crustPath, crustPaint);

    // Inner pizza (com margem de borda/crosta)
    final innerRadius = radius * 0.88;
    final flavor = pizza.selectedFlavors[0];
    final innerPaint = Paint();

    if (flavor != null) {
      innerPaint.color = flavor.color ?? Colors.orange;
    } else {
      innerPaint.color = const Color(0xFFFFCC80).withValues(alpha: 0.5);
    }

    final innerPath = Path()
      ..moveTo(centerX, centerY - innerRadius)
      ..arcTo(
        Rect.fromCircle(center: center, radius: innerRadius),
        -pi / 2,
        pi,
        false,
      )
      ..close();
    canvas.drawPath(innerPath, innerPaint);

    // Corte reto vertical (lado esquerdo)
    final cutPaint = Paint()
      ..color = const Color(0xFFD4A574)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(centerX, centerY - radius),
      Offset(centerX, centerY + radius),
      cutPaint,
    );

    // Ingredientes
    if (flavor != null) {
      _drawBrotoIngredients(canvas, center, innerRadius, flavor.color);
    }

    // Label "Toque para escolher"
    if (flavor == null) {
      final textPainter = TextPainter(
        text: TextSpan(
          text: emptySliceText,
          style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500, height: 1.3),
        ),
        textDirection: TextDirection.ltr,
        textAlign: TextAlign.center,
      )..layout(maxWidth: radius * 1.2);
      textPainter.paint(
        canvas,
        Offset(centerX + radius * 0.1 - textPainter.width / 2, centerY - textPainter.height / 2),
      );
    }
  }

  void _drawBrotoIngredients(Canvas canvas, Offset center, double radius, Color? baseColor) {
    final random = Random(42);
    final ingredientPaint = Paint()..color = _contrastingColor(baseColor ?? Colors.orange);

    for (int k = 0; k < 15; k++) {
      double r = radius * 0.15 + random.nextDouble() * (radius * 0.7);
      // Ângulo apenas no lado direito: -pi/2 a pi/2 (topo → direita → baixo)
      double theta = -pi / 2 + random.nextDouble() * pi;
      
      double x = center.dx + r * cos(theta);
      double y = center.dy + r * sin(theta);

      // Garantir que está no lado direito do corte
      if (x > center.dx) {
        canvas.drawCircle(Offset(x, y), 3, ingredientPaint);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GRANDE: Círculo completo com fatias
  // ═══════════════════════════════════════════════════════════
  void _paintGrande(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = min(size.width, size.height) / 2;
    final innerRadius = radius * 0.9;
    final innerRect = Rect.fromCircle(center: center, radius: innerRadius);
    
    // Crust
    final crustPaint = Paint()..color = const Color(0xFFEBCBAE);
    canvas.drawCircle(center, radius, crustPaint);
    
    // Slices
    int slices = pizza.activeSlices;
    double startAngle = 0;
    double sweepAngle = (2 * pi) / slices;

    for (int i = 0; i < slices; i++) {
      final flavor = pizza.selectedFlavors[i];
      
      final slicePaint = Paint();
      if (flavor != null) {
        slicePaint.color = flavor.color ?? Colors.orange;
      } else {
        slicePaint.color = const Color(0xFFFFCC80).withValues(alpha: 0.5);
      }
      
      canvas.drawArc(innerRect, startAngle, sweepAngle, true, slicePaint);
      
      if (flavor != null) {
        _drawIngredients(canvas, center, innerRadius, startAngle, sweepAngle, flavor.color);
      }

      if (slices > 1) {
        final borderPaint = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
        canvas.drawArc(innerRect, startAngle, sweepAngle, true, borderPaint);
      }

      startAngle += sweepAngle;
    }
  }

  void _drawIngredients(Canvas canvas, Offset center, double radius, double startAngle, double sweepAngle, Color? baseColor) {
    final random = Random(startAngle.toInt());
    final ingredientPaint = Paint()..color = _contrastingColor(baseColor ?? Colors.orange);
    
    for (int k = 0; k < 10; k++) {
      double r = radius * 0.2 + random.nextDouble() * (radius * 0.7);
      double theta = startAngle + random.nextDouble() * sweepAngle;
      
      double x = center.dx + r * cos(theta);
      double y = center.dy + r * sin(theta);
      
      canvas.drawCircle(Offset(x, y), 3, ingredientPaint);
    }
  }
  
  Color _contrastingColor(Color color) {
    if (color.computeLuminance() > 0.5) return Colors.black12;
    return Colors.white30;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
