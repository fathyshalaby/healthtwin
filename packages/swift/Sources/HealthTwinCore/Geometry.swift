public struct ViewBox: Sendable {
    public static let width: Double = 200
    public static let height: Double = 400
}

public enum Primitive: Sendable {
    case ellipse(cx: Double, cy: Double, rx: Double, ry: Double)
    case roundedRect(x: Double, y: Double, w: Double, h: Double, r: Double)

    public func contains(x px: Double, y py: Double, pad: Double = 10) -> Bool {
        switch self {
        case let .ellipse(cx, cy, rx, ry):
            let dx = (px - cx) / (rx + pad)
            let dy = (py - cy) / (ry + pad)
            return dx * dx + dy * dy <= 1
        case let .roundedRect(x, y, w, h, _):
            return px >= x - pad && px <= x + w + pad && py >= y - pad && py <= y + h + pad
        }
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

public func hitTest(x: Double, y: Double, view: BodyView, pad: Double = 10) -> Shape? {
    for s in shapes(for: view).reversed() {
        if s.primitive.contains(x: x, y: y, pad: pad) { return s }
    }
    return nil
}
