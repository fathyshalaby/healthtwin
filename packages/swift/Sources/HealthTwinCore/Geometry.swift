public struct ViewBox: Sendable {
    public static let width: Double = 200
    public static let height: Double = 400
}

/// How far outside a shape a tap still counts (viewBox units) — the same value every SDK uses.
public let hitPad: Double = 10

public enum Primitive: Sendable {
    case ellipse(cx: Double, cy: Double, rx: Double, ry: Double)
    case roundedRect(x: Double, y: Double, w: Double, h: Double, r: Double)

    /// Distance (viewBox units) from (px, py) to the outside of this shape; 0 when inside.
    /// Mirrors `distanceOutside` in @healthtwin/bodymap-core: rounded rects are exact, ellipses use the
    /// radial approximation (exact for circles).
    public func distanceOutside(x px: Double, y py: Double) -> Double {
        switch self {
        case let .ellipse(cx, cy, rx, ry):
            let nx = (px - cx) / rx
            let ny = (py - cy) / ry
            let f = (nx * nx + ny * ny).squareRoot()
            if f <= 1 { return 0 }
            let dx = px - cx
            let dy = py - cy
            return (dx * dx + dy * dy).squareRoot() * (1 - 1 / f)
        case let .roundedRect(x, y, w, h, r):
            let k = min(r, w / 2, h / 2)
            let dx = max(abs(px - (x + w / 2)) - (w / 2 - k), 0)
            let dy = max(abs(py - (y + h / 2)) - (h / 2 - k), 0)
            return max((dx * dx + dy * dy).squareRoot() - k, 0)
        }
    }

    /// Area in square viewBox units (the near-miss tie-breaker: smaller wins).
    public var area: Double {
        switch self {
        case let .ellipse(_, _, rx, ry):
            return Double.pi * rx * ry
        case let .roundedRect(_, _, w, h, r):
            let k = min(r, w / 2, h / 2)
            return w * h - (4 - Double.pi) * k * k
        }
    }

    public func contains(x px: Double, y py: Double, pad: Double = hitPad) -> Bool {
        distanceOutside(x: px, y: py) <= pad
    }
}

public struct Shape: Sendable {
    public var key: String
    public var regionId: String
    public var side: Side
    public var view: BodyView
    public var label: String
    public var primitive: Primitive
}

public func shapes(for view: BodyView) -> [Shape] {
    Shape.all.filter { $0.view == view }
}

/// Which region a tap at (x, y) — viewBox units — means. Same rule as `hitTest` in @healthtwin/bodymap-core:
/// 1. exact first: the topmost shape that contains the point (what the person visibly tapped);
/// 2. near miss: the nearest shape within `pad`; on a tie, the smaller one (a joint beats the limb beside it).
public func hitTest(x: Double, y: Double, view: BodyView, pad: Double = hitPad) -> Shape? {
    let all = shapes(for: view)
    for s in all.reversed() where s.primitive.distanceOutside(x: x, y: y) == 0 {
        return s
    }
    var best: Shape?
    var bestD = Double.infinity
    var bestA = Double.infinity
    for s in all {
        let d = s.primitive.distanceOutside(x: x, y: y)
        if d > pad { continue }
        let a = s.primitive.area
        if d < bestD - 1e-9 || (abs(d - bestD) <= 1e-9 && a < bestA) {
            best = s
            bestD = d
            bestA = a
        }
    }
    return best
}
