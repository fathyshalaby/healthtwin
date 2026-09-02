package com.healthtwin

enum class HeatmapMetric { frequency, meanIntensity, recency }

fun computeHeatmap(
    current: List<Observation>,
    metric: HeatmapMetric = HeatmapMetric.frequency,
    from: Long? = null,
): Map<String, Double> {
    val groups = mutableMapOf<String, MutableList<Observation>>()
    for (o in current) {
        if (from != null && o.occurredAt < from) continue
        val k = "${o.location.regionId}:${o.location.side.name}:${o.location.view.name}"
        groups.getOrPut(k) { mutableListOf() }.add(o)
    }
    val out = mutableMapOf<String, Double>()
    for ((k, obs) in groups) {
        when (metric) {
            HeatmapMetric.frequency -> out[k] = obs.size.toDouble()
            HeatmapMetric.meanIntensity -> {
                val vals = obs.mapNotNull { it.intensity }
                if (vals.isNotEmpty()) out[k] = vals.average()
            }
            HeatmapMetric.recency -> out[k] = obs.maxOf { it.occurredAt }.toDouble()
        }
    }
    return out
}
