import { PageHeader } from "../../src/components/PageHeader";

export default function SdkPage() {
  return (
    <>
      <PageHeader eyebrow="SDK · Flutter · Swift · Kotlin" title="The same figure, in partner apps">
        Geometry lives in <code>packages/mobile/shapes.json</code>. Each native SDK only paints pixels and hit-tests.
        Stores are in-memory until you persist them in your own backend — same idea as the web embed events.
      </PageHeader>

      <section className="card">
        <h2>Flutter</h2>
        <pre className="code-oneline">{`import 'package:healthtwin/healthtwin.dart';

final store = MemoryStore();
HealthTwinCapture(store: store);
HealthTwinReview(store: store);`}</pre>
        <p className="muted">Package: <code>packages/flutter</code> · <code>flutter test</code></p>
      </section>

      <section className="card">
        <h2>Swift / SwiftUI</h2>
        <pre className="code-oneline">{`import HealthTwinCore
import HealthTwinUI

let store = MemoryStore()
HealthTwinCaptureView(store: store)`}</pre>
        <p className="muted">Package: <code>packages/swift</code> · <code>swift test</code></p>
      </section>

      <section className="card">
        <h2>Kotlin / Android</h2>
        <pre className="code-oneline">{`val store = MemoryStore()
val hit = hitTest(x, y, BodyView.anterior)
store.add(NewObservation(hit!!.location, ObservationType.pain, intensity = 6.0))`}</pre>
        <p className="muted">Package: <code>packages/android</code> · <code>gradle test</code> · Compose body map in <code>compose/BodyMap.kt</code></p>
      </section>

      <section className="card">
        <h2>Web embed (no React required)</h2>
        <pre className="code-oneline">{`<health-twin-capture view="anterior" subject-id="u_123"></health-twin-capture>
<script>
  el.addEventListener("healthtwin:observation", (e) => {
    // persist e.detail in YOUR backend — you stay the data controller
  });
</script>`}</pre>
        <p className="muted">See the live widget on the <a href="/embed">Embed</a> tab.</p>
      </section>
    </>
  );
}
