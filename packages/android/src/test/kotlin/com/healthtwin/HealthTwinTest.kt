package com.healthtwin

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class HealthTwinTest {
    @Test
    fun hitTestLeftKnee() {
        val hit = hitTest(87.0, 272.0, BodyView.anterior)
        assertNotNull(hit)
        assertEquals("Left Knee", hit.label)
        assertEquals("knee", hit.regionId)
        assertEquals(Side.left, hit.side)
    }

    @Test
    fun hitTestLowerBack() {
        val hit = hitTest(100.0, 144.0, BodyView.posterior)
        assertNotNull(hit)
        assertEquals("Lower Back", hit.label)
    }

    // ── hit-testing: the same cases as packages/bodymap-core/src/hittest.test.ts ──────────────

    @Test
    fun everyRegionCentreResolvesToItself() {
        for (view in listOf(BodyView.anterior, BodyView.posterior)) {
            for (s in shapesFor(view)) {
                val (cx, cy) = when (val p = s.primitive) {
                    is Primitive.Ellipse -> p.cx to p.cy
                    is Primitive.RoundedRect -> (p.x + p.w / 2) to (p.y + p.h / 2)
                }
                assertEquals(s.key, hitTest(cx, cy, view)?.key, "$view ${s.label}")
            }
        }
    }

    @Test
    fun tapInsideLeftKneeIsLeftKnee() {
        // inside the left knee, but within the right knee's padded zone — used to return the right knee
        assertEquals("Left Knee", hitTest(95.0, 272.0, BodyView.anterior)?.label)
        assertEquals("Right Knee", hitTest(105.0, 272.0, BodyView.anterior)?.label)
    }

    @Test
    fun shoulderCentreIsShoulder() {
        assertEquals("Right Shoulder", hitTest(134.0, 82.0, BodyView.anterior)?.label)
        assertEquals("Left Shoulder", hitTest(66.0, 82.0, BodyView.anterior)?.label)
    }

    @Test
    fun visibleOverlapGoesToTopmost() {
        assertEquals("Chest", hitTest(125.0, 82.0, BodyView.anterior)?.label)
    }

    @Test
    fun nearMissesGoToNearestThenSmaller() {
        assertEquals("Left Knee", hitTest(87.0, 286.5, BodyView.anterior)?.label) // knee/shin tie → knee
        assertEquals("Left Hand", hitTest(37.0, 204.0, BodyView.anterior)?.label)
        assertEquals("Left Hand", hitTest(40.0 - HIT_PAD, 204.0, BodyView.anterior)?.label)
        assertNull(hitTest(40.0 - HIT_PAD - 0.5, 204.0, BodyView.anterior))
        assertNull(hitTest(5.0, 5.0, BodyView.anterior))
    }

    @Test
    fun foldLogTombstone() {
        val store = MemoryStore()
        val a = store.add(
            NewObservation(
                location = Location("knee", Side.left, BodyView.anterior),
                type = ObservationType.pain,
                intensity = 6.0,
            ),
        )
        assertEquals(1, store.live.size)
        store.remove(a)
        assertEquals(0, store.live.size)
    }

    @Test
    fun heatmapMeanIntensity() {
        val store = MemoryStore()
        val loc = Location("knee", Side.left, BodyView.anterior)
        store.add(NewObservation(loc, ObservationType.pain, intensity = 4.0))
        store.add(NewObservation(loc, ObservationType.pain, intensity = 8.0))
        val h = computeHeatmap(store.live, HeatmapMetric.meanIntensity)
        assertEquals(6.0, h["knee:left:anterior"])
    }
}
