#if canImport(SwiftUI)
import SwiftUI
import HealthTwinCore

public struct BodyMapView: View {
    public var view: BodyView
    public var selectedKey: String?
    public var shading: [String: Color]
    public var onSelect: (Shape) -> Void

    public init(view: BodyView, selectedKey: String? = nil, shading: [String: Color] = [:], onSelect: @escaping (Shape) -> Void) {
        self.view = view
        self.selectedKey = selectedKey
        self.shading = shading
        self.onSelect = onSelect
    }

    public var body: some View {
        GeometryReader { geo in
            Canvas { ctx, size in
                let sx = size.width / ViewBox.width
                let sy = size.height / ViewBox.height
                let unit = min(sx, sy)
                let all = shapes(for: view)
                // One silhouette, like the web body map: stroke every region here, then fill them borderless on top,
                // so only the figure's outer edge shows — a body, not a stack of parts.
                let outline = Color(red: 127 / 255, green: 144 / 255, blue: 168 / 255)
                for s in all {
                    ctx.stroke(path(s.primitive, sx: sx, sy: sy), with: .color(outline), style: StrokeStyle(lineWidth: 2.6 * unit, lineJoin: .round))
                }
                for s in all {
                    let marked = selectedKey == s.key || shading[s.key] != nil
                    let fill = selectedKey == s.key
                        ? Color(red: 37 / 255, green: 99 / 255, blue: 235 / 255)
                        : (shading[s.key] ?? Color(red: 227 / 255, green: 233 / 255, blue: 241 / 255))
                    let p = path(s.primitive, sx: sx, sy: sy)
                    ctx.fill(p, with: .color(fill))
                    // only a region that carries information gets an edge
                    if marked { ctx.stroke(p, with: .color(Color.white.opacity(0.7)), lineWidth: unit) }
                }
                // Which side is which: "left" is the viewer's left in both views (the front view is a mirror).
                let tint = Color(red: 138 / 255, green: 151 / 255, blue: 171 / 255)
                let side = { (label: String) in Text(label).font(.system(size: 11 * unit, weight: .semibold)).foregroundColor(tint) }
                ctx.draw(side("L"), at: CGPoint(x: 34 * sx, y: 205 * sy))
                ctx.draw(side("R"), at: CGPoint(x: 166 * sx, y: 205 * sy))
            }
            .contentShape(Rectangle())
            .gesture(DragGesture(minimumDistance: 0).onEnded { value in
                let x = value.location.x / geo.size.width * ViewBox.width
                let y = value.location.y / geo.size.height * ViewBox.height
                if let hit = hitTest(x: x, y: y, view: view) { onSelect(hit) }
            })
        }
        .aspectRatio(ViewBox.width / ViewBox.height, contentMode: .fit)
    }

    private func path(_ p: Primitive, sx: CGFloat, sy: CGFloat) -> Path {
        switch p {
        case let .ellipse(cx, cy, rx, ry):
            return Path(ellipseIn: CGRect(x: (cx - rx) * sx, y: (cy - ry) * sy, width: rx * 2 * sx, height: ry * 2 * sy))
        case let .roundedRect(x, y, w, h, r):
            return Path(roundedRect: CGRect(x: x * sx, y: y * sy, width: w * sx, height: h * sy), cornerRadius: r * min(sx, sy))
        }
    }
}

public struct HealthTwinCaptureView: View {
    @ObservedObject private var box: StoreBox
    @State private var view: BodyView = .anterior
    @State private var selected: Shape?

    public init(store: MemoryStore) {
        self.box = StoreBox(store)
    }

    public var body: some View {
        VStack {
            Picker("View", selection: $view) {
                Text("Front").tag(BodyView.anterior)
                Text("Back").tag(BodyView.posterior)
            }
            .pickerStyle(.segmented)
            BodyMapView(view: view, selectedKey: selected?.key) { shape in
                selected = shape
            }
            .frame(height: 360)
            if let selected {
                EntrySheet(shape: selected, view: view) { draft in
                    box.store.add(draft)
                    box.objectWillChange.send()
                    self.selected = nil
                } onCancel: {
                    self.selected = nil
                }
            }
            List(box.store.live) { o in
                Text("\(o.location.regionId) · \(o.type.rawValue)")
            }
        }
    }
}

private final class StoreBox: ObservableObject {
    let store: MemoryStore
    init(_ store: MemoryStore) { self.store = store }
}

private struct EntrySheet: View {
    let shape: Shape
    let view: BodyView
    var onSave: (NewObservation) -> Void
    var onCancel: () -> Void
    @State private var type: ObservationType = .pain
    @State private var intensity: Double = 5

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(shape.label).font(.title2.bold())
            Picker("Type", selection: $type) {
                ForEach([ObservationType.pain, .stiffness, .numbness, .tingling, .swelling, .weakness, .other], id: \.self) {
                    Text($0.rawValue).tag($0)
                }
            }
            Slider(value: $intensity, in: 0...10, step: 1)
            HStack {
                Button("Save") {
                    onSave(NewObservation(
                        location: Location(regionId: shape.regionId, side: shape.side, view: view),
                        type: type,
                        intensity: intensity
                    ))
                }
                .buttonStyle(.borderedProminent)
                Button("Cancel", action: onCancel)
            }
        }
        .padding()
    }
}
#endif
