package com.healthtwin

class MemoryStore(
    val subjectId: String = "local-device",
    val origin: String = "android",
) {
    private val rows = mutableListOf<Observation>()
    val all: List<Observation> get() = rows.toList()
    val live: List<Observation> get() = foldLog(rows)

    fun add(input: NewObservation): Observation {
        val now = System.currentTimeMillis()
        val row = Observation(
            id = makeId(),
            subjectId = subjectId,
            origin = origin,
            occurredAt = input.occurredAt ?: now,
            createdAt = now,
            location = input.location,
            type = input.type,
            quality = input.quality,
            intensity = input.intensity,
            note = input.note,
            contextTags = input.contextTags,
        )
        rows += row
        return row
    }

    fun remove(prev: Observation): Observation {
        val next = add(NewObservation(location = prev.location, type = prev.type))
        val tomb = next.copy(supersedes = prev.id, tombstone = true)
        rows[rows.lastIndex] = tomb
        return tomb
    }

    companion object {
        private fun makeId(): String {
            val ms = System.currentTimeMillis()
            return ("ht" + ms.toString(16) + ms.toString(16)).padEnd(26, '0').take(26)
        }
    }
}
