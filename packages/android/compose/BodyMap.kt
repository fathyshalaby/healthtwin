package com.healthtwin.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import com.healthtwin.BodyView
import com.healthtwin.Primitive
import com.healthtwin.Shape
import com.healthtwin.VIEWBOX_H
import com.healthtwin.VIEWBOX_W
import com.healthtwin.hitTest
import com.healthtwin.shapesFor

/**
 * Jetpack Compose body map. Add this file to an Android/Compose app along with
 * the HealthTwin JVM core (`com.healthtwin`).
 */
@Composable
fun BodyMap(
    view: BodyView,
    modifier: Modifier = Modifier,
    selectedKey: String? = null,
    shading: Map<String, Color> = emptyMap(),
    onSelect: (Shape) -> Unit,
) {
    Canvas(
        modifier
            .fillMaxWidth()
            .aspectRatio((VIEWBOX_W / VIEWBOX_H).toFloat())
            .pointerInput(view) {
                detectTapGestures { pos ->
                    val x = pos.x / size.width * VIEWBOX_W
                    val y = pos.y / size.height * VIEWBOX_H
                    hitTest(x, y, view)?.let(onSelect)
                }
            },
    ) {
        val sx = size.width / VIEWBOX_W.toFloat()
        val sy = size.height / VIEWBOX_H.toFloat()
        for (s in shapesFor(view)) {
            val fill = if (selectedKey == s.key) Color(0xFF2563EB) else shading[s.key] ?: Color(0xFFCBD5E1)
            when (val p = s.primitive) {
                is Primitive.Ellipse -> {
                    drawOval(
                        color = fill,
                        topLeft = Offset(((p.cx - p.rx) * sx).toFloat(), ((p.cy - p.ry) * sy).toFloat()),
                        size = Size((p.rx * 2 * sx).toFloat(), (p.ry * 2 * sy).toFloat()),
                    )
                    drawOval(
                        color = Color(0xFF334155),
                        topLeft = Offset(((p.cx - p.rx) * sx).toFloat(), ((p.cy - p.ry) * sy).toFloat()),
                        size = Size((p.rx * 2 * sx).toFloat(), (p.ry * 2 * sy).toFloat()),
                        style = Stroke(width = 1f),
                    )
                }
                is Primitive.RoundedRect -> {
                    drawRoundRect(
                        color = fill,
                        topLeft = Offset((p.x * sx).toFloat(), (p.y * sy).toFloat()),
                        size = Size((p.w * sx).toFloat(), (p.h * sy).toFloat()),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius((p.r * minOf(sx, sy)).toFloat()),
                    )
                }
            }
        }
    }
}
