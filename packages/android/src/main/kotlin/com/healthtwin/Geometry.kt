package com.healthtwin

sealed class Primitive {
    data class Ellipse(val cx: Double, val cy: Double, val rx: Double, val ry: Double) : Primitive()
    data class RoundedRect(val x: Double, val y: Double, val w: Double, val h: Double, val r: Double) : Primitive()

    fun contains(px: Double, py: Double, pad: Double = 10.0): Boolean = when (this) {
        is Ellipse -> {
            val dx = (px - cx) / (rx + pad)
            val dy = (py - cy) / (ry + pad)
            dx * dx + dy * dy <= 1
        }
        is RoundedRect -> px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad
    }
}

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

fun hitTest(x: Double, y: Double, view: BodyView, pad: Double = 10.0): Shape? =
    shapesFor(view).asReversed().firstOrNull { it.primitive.contains(x, y, pad) }
