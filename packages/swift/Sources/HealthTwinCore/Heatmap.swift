import Foundation

public enum HeatmapMetric: Sendable { case frequency, meanIntensity, recency }

public func computeHeatmap(_ current: [Observation], metric: HeatmapMetric = .frequency, from: Date? = nil) -> [String: Double] {
    var groups: [String: [Observation]] = [:]
    for o in current {
        if let from, o.occurredAt < from { continue }
        let k = "\(o.location.regionId):\(o.location.side.rawValue):\(o.location.view.rawValue)"
        groups[k, default: []].append(o)
    }
    var out: [String: Double] = [:]
    for (k, obs) in groups {
        switch metric {
        case .frequency:
            out[k] = Double(obs.count)
        case .meanIntensity:
            let vals = obs.compactMap { $0.intensity }
            if !vals.isEmpty { out[k] = vals.reduce(0, +) / Double(vals.count) }
        case .recency:
            out[k] = obs.map { $0.occurredAt.timeIntervalSince1970 }.max() ?? 0
        }
    }
    return out
}
