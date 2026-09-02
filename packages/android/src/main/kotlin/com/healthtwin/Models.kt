package com.healthtwin

enum class Side { left, right, central }
enum class BodyView { anterior, posterior }
enum class ObservationType { pain, stiffness, numbness, tingling, swelling, weakness, other }
enum class Quality { sharp, dull, burning, throbbing, aching, stabbing, cramping }

data class Location(
    val regionId: String,
    val side: Side,
    val view: BodyView,
    val pointX: Double? = null,
    val pointY: Double? = null,
)

data class Observation(
    val id: String,
    val subjectId: String,
    val origin: String,
    val occurredAt: Long,
    val createdAt: Long,
    val location: Location,
    val type: ObservationType,
    val quality: List<Quality>? = null,
    val intensity: Double? = null,
    val note: String? = null,
    val contextTags: List<String>? = null,
    val taxonomyVersion: String = "1.1.0",
    val supersedes: String? = null,
    val tombstone: Boolean = false,
)

data class NewObservation(
    val location: Location,
    val type: ObservationType,
    val quality: List<Quality>? = null,
    val intensity: Double? = null,
    val note: String? = null,
    val contextTags: List<String>? = null,
    val occurredAt: Long? = null,
)

fun foldLog(all: List<Observation>): List<Observation> {
    val superseded = all.mapNotNull { it.supersedes }.toSet()
    return all.filter { it.id !in superseded && !it.tombstone }
}
