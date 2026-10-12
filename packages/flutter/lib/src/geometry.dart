import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/painting.dart' show HSLColor;

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

  /// Distance (viewBox units) from (px, py) to the outside of this shape; 0 when inside.
  /// Mirrors `distanceOutside` in @healthtwin/bodymap-core: rounded rects are exact, ellipses use the
  /// radial approximation (exact for circles).
  double distanceOutside(double px, double py) {
    if (isEllipse) {
      final nx = (px - cx) / rx;
      final ny = (py - cy) / ry;
      final f = math.sqrt(nx * nx + ny * ny);
      if (f <= 1) return 0.0;
      final dx = px - cx;
      final dy = py - cy;
      return math.sqrt(dx * dx + dy * dy) * (1 - 1 / f);
    }
    final k = math.min(r, math.min(w / 2, h / 2));
    final dx = math.max((px - (x + w / 2)).abs() - (w / 2 - k), 0.0);
    final dy = math.max((py - (y + h / 2)).abs() - (h / 2 - k), 0.0);
    return math.max(math.sqrt(dx * dx + dy * dy) - k, 0.0);
  }

  /// Area in square viewBox units (the near-miss tie-breaker: smaller wins).
  double get area {
    if (isEllipse) return math.pi * rx * ry;
    final k = math.min(r, math.min(w / 2, h / 2));
    return w * h - (4 - math.pi) * k * k;
  }

  bool contains(double px, double py, {double pad = kHitPad}) =>
      distanceOutside(px, py) <= pad;
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

/// Which region a tap at [p] (viewBox units, 200×400) means. Same rule as `hitTest` in
/// @healthtwin/bodymap-core:
/// 1. exact first: the topmost shape that contains the point (what the person visibly tapped);
/// 2. near miss: the nearest shape within [pad]; on a tie, the smaller one (a joint beats the limb beside it).
Shape? hitTest(Offset p, BodyView view, {double pad = kHitPad}) {
  final shapes = shapesFor(view);
  for (var i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].primitive.distanceOutside(p.dx, p.dy) == 0) return shapes[i];
  }
  Shape? best;
  var bestD = double.infinity;
  var bestA = double.infinity;
  for (final s in shapes) {
    final d = s.primitive.distanceOutside(p.dx, p.dy);
    if (d > pad) continue;
    final a = s.primitive.area;
    if (d < bestD - 1e-9 || ((d - bestD).abs() <= 1e-9 && a < bestA)) {
      best = s;
      bestD = d;
      bestA = a;
    }
  }
  return best;
}

/// t∈[0,1] → the shared cool→hot heat scale: hue 210 (blue) → 0 (red) at 85% saturation, 55% lightness —
/// the same sweep as `heatColor` in @healthtwin/bodymap-core, so the web and Flutter heatmaps match.
Color heatColor(double t) {
  final clamped = t.clamp(0.0, 1.0);
  return HSLColor.fromAHSL(1, 210 - clamped * 210, 0.85, 0.55).toColor();
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
