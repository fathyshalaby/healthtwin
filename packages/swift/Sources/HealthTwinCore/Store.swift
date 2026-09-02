import Foundation

public final class MemoryStore: @unchecked Sendable {
    public let subjectId: String
    public let origin: String
    private var rows: [Observation] = []

    public init(subjectId: String = "local-device", origin: String = "swift") {
        self.subjectId = subjectId
        self.origin = origin
    }

    public var all: [Observation] { rows }
    public var live: [Observation] { foldLog(rows) }

    @discardableResult
    public func add(_ input: NewObservation) -> Observation {
        let now = Date()
        let row = Observation(
            id: Self.makeId(),
            subjectId: subjectId,
            origin: origin,
            occurredAt: input.occurredAt ?? now,
            createdAt: now,
            location: input.location,
            type: input.type,
            quality: input.quality,
            intensity: input.intensity,
            note: input.note,
            contextTags: input.contextTags,
            taxonomyVersion: "1.1.0",
            supersedes: nil,
            tombstone: false
        )
        rows.append(row)
        return row
    }

    @discardableResult
    public func remove(_ prev: Observation) -> Observation {
        var row = add(NewObservation(location: prev.location, type: prev.type))
        row.supersedes = prev.id
        row.tombstone = true
        rows[rows.count - 1] = row
        return row
    }

    private static func makeId() -> String {
        let ms = Int(Date().timeIntervalSince1970 * 1000)
        return String(format: "ht%013x%013x", ms, ms).prefix(26).description
    }
}
