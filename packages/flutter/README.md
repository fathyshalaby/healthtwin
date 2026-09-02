# healthtwin (Flutter)

Embeddable HealthTwin body-map capture for **Flutter** (iOS, Android, desktop).

Same geometry as the web SDK (`packages/mobile/shapes.json`): tap a region, log type · quality · 0–10 intensity, persist locally, review a heatmap.

```dart
import 'package:healthtwin/healthtwin.dart';

final store = MemoryStore();

HealthTwinCapture(store: store)
HealthTwinReview(store: store)
```

```bash
cd packages/flutter
flutter test
cd example && flutter run
```
