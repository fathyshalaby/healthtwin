package com.healthtwin

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.hypot

sealed class Primitive {
    data class Ellipse(val cx: Double, val cy: Double, val rx: Double, val ry: Double) : Primitive()
    data class RoundedRect(val x: Double, val y: Double, val w: Double, val h: Double, val r: Double) : Primitive()

    /**
     * Distance (viewBox units) from (px, py) to the outside of this shape; 0 when inside.
     * Mirrors `distanceOutside` in @healthtwin/bodymap-core: rounded rects are exact, ellipses use the
     * radial approximation (exact for circles).
     */
    fun distanceOutside(px: Double, py: Double): Double = when (this) {
        is Ellipse -> {
            val f = hypot((px - cx) / rx, (py - cy) / ry)
            if (f <= 1.0) 0.0 else hypot(px - cx, py - cy) * (1 - 1 / f)
        }
        is RoundedRect -> {
            val k = minOf(r, w / 2, h / 2)
            val dx = maxOf(abs(px - (x + w / 2)) - (w / 2 - k), 0.0)
            val dy = maxOf(abs(py - (y + h / 2)) - (h / 2 - k), 0.0)
            maxOf(hypot(dx, dy) - k, 0.0)
        }
    }

    /** Area in square viewBox units (the near-miss tie-breaker: smaller wins). */
    val area: Double
        get() = when (this) {
            is Ellipse -> PI * rx * ry
            is RoundedRect -> {
                val k = minOf(r, w / 2, h / 2)
                w * h - (4 - PI) * k * k
            }
        }

    fun contains(px: Double, py: Double, pad: Double = HIT_PAD): Boolean = distanceOutside(px, py) <= pad
}

/** How far outside a shape a tap still counts (viewBox units) — the same value every SDK uses. */
const val HIT_PAD = 10.0

data class Shape(
    val key: String,
    val regionId: String,
    val side: Side,
    val view: BodyView,
    val label: String,
    val primitive: Primitive,
)

const val VIEWBOX_W = 200.0
const val VIEWBOX_H = 400.0

fun shapesFor(view: BodyView): List<Shape> = ALL_SHAPES.filter { it.view == view }

/**
 * Which region a tap at (x, y) — viewBox units — means. Same rule as `hitTest` in @healthtwin/bodymap-core:
 * 1. exact first: the topmost shape that contains the point (what the person visibly tapped);
 * 2. near miss: the nearest shape within [pad]; on a tie, the smaller one (a joint beats the limb beside it).
 */
fun hitTest(x: Double, y: Double, view: BodyView, pad: Double = HIT_PAD): Shape? {
    val shapes = shapesFor(view)
    shapes.asReversed().firstOrNull { it.primitive.distanceOutside(x, y) == 0.0 }?.let { return it }
    var best: Shape? = null
    var bestD = Double.POSITIVE_INFINITY
    var bestA = Double.POSITIVE_INFINITY
    for (s in shapes) {
        val d = s.primitive.distanceOutside(x, y)
        if (d > pad) continue
        val a = s.primitive.area
        if (d < bestD - 1e-9 || (abs(d - bestD) <= 1e-9 && a < bestA)) {
            best = s; bestD = d; bestA = a
        }
    }
    return best
}
