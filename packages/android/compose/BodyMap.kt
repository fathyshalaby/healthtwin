package com.healthtwin.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.DrawStyle
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
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
@OptIn(ExperimentalTextApi::class)
@Composable
fun BodyMap(
    view: BodyView,
    modifier: Modifier = Modifier,
    selectedKey: String? = null,
    shading: Map<String, Color> = emptyMap(),
    onSelect: (Shape) -> Unit,
) {
    val measurer = rememberTextMeasurer()
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
        val unit = minOf(sx, sy)
        val shapes = shapesFor(view)
        // One silhouette, like the web body map: stroke every region here, then fill them borderless on top,
        // so only the figure's outer edge shows — a body, not a stack of parts.
        val outline = Stroke(width = 2.6f * unit, join = StrokeJoin.Round)
        for (s in shapes) drawPrimitive(s.primitive, sx, sy, Color(0xFF7F90A8), outline)
        for (s in shapes) {
            val marked = selectedKey == s.key || shading.containsKey(s.key)
            val fill = if (selectedKey == s.key) Color(0xFF2563EB) else shading[s.key] ?: Color(0xFFE3E9F1)
            drawPrimitive(s.primitive, sx, sy, fill, Fill)
            // only a region that carries information gets an edge
            if (marked) drawPrimitive(s.primitive, sx, sy, Color.White.copy(alpha = 0.7f), Stroke(width = unit))
        }
        // Which side is which: "left" is the viewer's left in both views (the front view is a mirror).
        drawSideLabel(measurer, "L", Offset(34f * sx, 205f * sy), unit)
        drawSideLabel(measurer, "R", Offset(166f * sx, 205f * sy), unit)
    }
}

private fun DrawScope.drawPrimitive(p: Primitive, sx: Float, sy: Float, color: Color, style: DrawStyle) {
    when (p) {
        is Primitive.Ellipse -> drawOval(
            color = color,
            topLeft = Offset(((p.cx - p.rx) * sx).toFloat(), ((p.cy - p.ry) * sy).toFloat()),
            size = Size((p.rx * 2 * sx).toFloat(), (p.ry * 2 * sy).toFloat()),
            style = style,
        )
        is Primitive.RoundedRect -> drawRoundRect(
            color = color,
            topLeft = Offset((p.x * sx).toFloat(), (p.y * sy).toFloat()),
            size = Size((p.w * sx).toFloat(), (p.h * sy).toFloat()),
            cornerRadius = CornerRadius((p.r * minOf(sx, sy)).toFloat()),
            style = style,
        )
    }
}

@OptIn(ExperimentalTextApi::class)
private fun DrawScope.drawSideLabel(measurer: TextMeasurer, text: String, centre: Offset, unit: Float) {
    val layout = measurer.measure(
        AnnotatedString(text),
        style = TextStyle(color = Color(0xFF8A97AB), fontSize = (11f * unit).toSp(), fontWeight = FontWeight.SemiBold),
    )
    drawText(layout, topLeft = centre - Offset(layout.size.width / 2f, layout.size.height / 2f))
}
