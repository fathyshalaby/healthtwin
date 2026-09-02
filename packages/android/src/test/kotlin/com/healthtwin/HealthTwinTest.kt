package com.healthtwin

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

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
