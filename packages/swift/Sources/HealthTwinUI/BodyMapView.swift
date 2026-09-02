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
                for s in shapes(for: view) {
                    let fill = selectedKey == s.key ? Color.blue : (shading[s.key] ?? Color(red: 0.8, green: 0.84, blue: 0.88))
                    ctx.fill(path(s.primitive, sx: sx, sy: sy), with: .color(fill))
                    ctx.stroke(path(s.primitive, sx: sx, sy: sy), with: .color(Color(red: 0.2, green: 0.25, blue: 0.33)), lineWidth: 1)
                }
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
