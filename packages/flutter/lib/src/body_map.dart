import 'package:flutter/material.dart';

import 'geometry.dart';
import 'model.dart';

/// Interactive body figure. [onSelect] fires with the tapped region in viewBox space.
class BodyMap extends StatelessWidget {
  const BodyMap({
    super.key,
    required this.view,
    required this.onSelect,
    this.selectedKey,
    this.shading,
    this.height = 360,
  });

  final BodyView view;
  final void Function(Shape shape, Offset viewBoxPoint) onSelect;
  final String? selectedKey;
  final Map<String, Color>? shading;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, height);
          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapDown: (d) {
              final p = _toViewBox(d.localPosition, size);
              final hit = hitTest(p, view);
              if (hit != null) onSelect(hit, p);
            },
            child: CustomPaint(
              size: size,
              painter: _BodyMapPainter(
                view: view,
                selectedKey: selectedKey,
                shading: shading,
              ),
            ),
          );
        },
      ),
    );
  }
}

Offset _toViewBox(Offset local, Size size) {
  return Offset(
    local.dx / size.width * kViewBox.width,
    local.dy / size.height * kViewBox.height,
  );
}

class _BodyMapPainter extends CustomPainter {
  _BodyMapPainter({required this.view, this.selectedKey, this.shading});

  final BodyView view;
  final String? selectedKey;
  final Map<String, Color>? shading;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / kViewBox.width, size.height / kViewBox.height);
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = const Color(0xFF334155);
    for (final s in shapesFor(view)) {
      final fill = Paint()
        ..style = PaintingStyle.fill
        ..color = selectedKey == s.key
            ? const Color(0xFF2563EB)
            : (shading?[s.key] ?? const Color(0xFFCBD5E1));
      _draw(canvas, s.primitive, fill);
      _draw(canvas, s.primitive, stroke);
    }
  }

  void _draw(Canvas canvas, Primitive p, Paint paint) {
    if (p.isEllipse) {
      canvas.drawOval(Rect.fromCenter(center: Offset(p.cx, p.cy), width: p.rx * 2, height: p.ry * 2), paint);
    } else {
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(p.x, p.y, p.w, p.h), Radius.circular(p.r)),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BodyMapPainter old) =>
      old.view != view || old.selectedKey != selectedKey || old.shading != shading;
}
