import 'dart:math' as math;
import 'dart:ui';

import 'model.dart';

part 'shapes.g.dart';

const Size kViewBox = Size(200, 400);
const double kHitPad = 10;

class Primitive {
  const Primitive.ellipse(this.cx, this.cy, this.rx, this.ry)
      : _kind = _Kind.ellipse,
        x = 0,
        y = 0,
        w = 0,
        h = 0,
        r = 0;

  const Primitive.rr(this.x, this.y, this.w, this.h, this.r)
      : _kind = _Kind.rr,
        cx = 0,
        cy = 0,
        rx = 0,
        ry = 0;

  final _Kind _kind;
  final double cx, cy, rx, ry;
  final double x, y, w, h, r;

  bool get isEllipse => _kind == _Kind.ellipse;

  bool contains(double px, double py, {double pad = kHitPad}) {
    if (isEllipse) {
      final dx = (px - cx) / (rx + pad);
      final dy = (py - cy) / (ry + pad);
      return dx * dx + dy * dy <= 1;
    }
    return px >= x - pad &&
        px <= x + w + pad &&
        py >= y - pad &&
        py <= y + h + pad;
  }
}

enum _Kind { ellipse, rr }

class Shape {
  const Shape({
    required this.key,
    required this.regionId,
    required this.side,
    required this.view,
    required this.label,
    required this.primitive,
  });

  final String key;
  final String regionId;
  final Side side;
  final BodyView view;
  final String label;
  final Primitive primitive;
}

List<Shape> shapesFor(BodyView view) =>
    kAllShapes.where((s) => s.view == view).toList(growable: false);

/// Front-most matching region, or null. [p] is in viewBox units (200×400).
Shape? hitTest(Offset p, BodyView view, {double pad = kHitPad}) {
  final shapes = shapesFor(view);
  for (var i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].primitive.contains(p.dx, p.dy, pad: pad)) return shapes[i];
  }
  return null;
}

Color heatColor(double t) {
  final clamped = t.clamp(0.0, 1.0);
  return Color.lerp(const Color(0xFF3B82F6), const Color(0xFFEF4444), clamped)!;
}

Map<String, Color> shadingFor(Map<String, double> values) {
  if (values.isEmpty) return {};
  final vals = values.values.toList();
  final min = vals.reduce(math.min);
  final max = vals.reduce(math.max);
  final out = <String, Color>{};
  for (final e in values.entries) {
    final t = max == min ? 1.0 : (e.value - min) / (max - min);
    out[e.key] = heatColor(t);
  }
  return out;
}
