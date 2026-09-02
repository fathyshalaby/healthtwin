# Mobile SDKs

Shared body-map geometry for **Flutter**, **Swift**, and **Kotlin/Android**.

`shapes.json` is the source of truth (same primitives as `@healthtwin/bodymap-core`). Regenerate language tables:

```bash
python3 packages/mobile/generate.py
```

| Platform | Package | UI |
|---|---|---|
| Flutter | [`packages/flutter`](../flutter) | `HealthTwinCapture` / `HealthTwinReview` |
| Swift | [`packages/swift`](../swift) | SwiftUI `HealthTwinCaptureView` |
| Kotlin | [`packages/android`](../android) | Compose `BodyMap` |
| React Native | [`packages/native`](../native) + [`apps/native`](../../apps/native) | Expo (already shipped) |
