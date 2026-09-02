# HealthTwin (Kotlin / Android)

JVM core for **Android / Kotlin** apps, plus a Jetpack Compose `BodyMap` you drop into a Compose screen.

```kotlin
val store = MemoryStore()
val hit = hitTest(x, y, BodyView.anterior)
store.add(NewObservation(hit.location, ObservationType.pain, intensity = 6.0))
```

Compose UI lives in [`compose/BodyMap.kt`](compose/BodyMap.kt) (copy into an app that already depends on Compose).

```bash
cd packages/android
gradle test
```
