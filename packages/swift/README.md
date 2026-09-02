# HealthTwin (Swift)

Native **Swift / SwiftUI** SDK for iOS and macOS.

- `HealthTwinCore` — observation model, body-map geometry + hit-testing, in-memory store, heatmap. Compiles on Linux (SwiftPM) and Apple platforms.
- `HealthTwinUI` — SwiftUI `BodyMapView` + `HealthTwinCaptureView` (Apple platforms).

```swift
import HealthTwinCore
import HealthTwinUI

let store = MemoryStore()
HealthTwinCaptureView(store: store)
```

```bash
cd packages/swift
swift test
```

Xcode: File → Add Package Dependencies → local `packages/swift`.
