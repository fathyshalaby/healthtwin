import Foundation

public enum Side: String, Sendable { case left, right, central }
public enum BodyView: String, Sendable { case anterior, posterior }
public enum ObservationType: String, Sendable {
    case pain, stiffness, numbness, tingling, swelling, weakness, other
}
public enum Quality: String, Sendable {
    case sharp, dull, burning, throbbing, aching, stabbing, cramping
}

public struct Location: Sendable {
    public var regionId: String
    public var side: Side
    public var view: BodyView
    public var point: (x: Double, y: Double)?
    public init(regionId: String, side: Side, view: BodyView, point: (x: Double, y: Double)? = nil) {
        self.regionId = regionId
        self.side = side
        self.view = view
        self.point = point
    }
}

public struct Observation: Sendable, Identifiable {
    public var id: String
    public var subjectId: String
    public var origin: String
    public var occurredAt: Date
    public var createdAt: Date
    public var location: Location
    public var type: ObservationType
    public var quality: [Quality]?
    public var intensity: Double?
    public var note: String?
    public var contextTags: [String]?
    public var taxonomyVersion: String
    public var supersedes: String?
    public var tombstone: Bool
}

public struct NewObservation: Sendable {
    public var location: Location
    public var type: ObservationType
    public var quality: [Quality]?
    public var intensity: Double?
    public var note: String?
    public var contextTags: [String]?
    public var occurredAt: Date?
    public init(location: Location, type: ObservationType, quality: [Quality]? = nil, intensity: Double? = nil, note: String? = nil, contextTags: [String]? = nil, occurredAt: Date? = nil) {
        self.location = location
        self.type = type
        self.quality = quality
        self.intensity = intensity
        self.note = note
        self.contextTags = contextTags
        self.occurredAt = occurredAt
    }
}

public func foldLog(_ all: [Observation]) -> [Observation] {
    let superseded = Set(all.compactMap { $0.supersedes })
    return all.filter { !superseded.contains($0.id) && !$0.tombstone }
}
