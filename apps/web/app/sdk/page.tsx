import Link from "next/link";
import { Smartphone, Apple, Bot, Globe } from "lucide-react";
import { PageHeader } from "../../src/components/PageHeader";
import { CodeBlock } from "../../src/components/CodeBlock";
import { Rise } from "@/components/motion";

const SDKS = [
  {
    icon: Smartphone, name: "Flutter", file: "main.dart", pkg: "packages/flutter", test: "flutter test",
    code: `import 'package:healthtwin/healthtwin.dart';

final store = MemoryStore();
HealthTwinCapture(store: store);
HealthTwinReview(store: store);`,
  },
  {
    icon: Apple, name: "Swift / SwiftUI", file: "App.swift", pkg: "packages/swift", test: "swift test",
    code: `import HealthTwinCore
import HealthTwinUI

let store = MemoryStore()
HealthTwinCaptureView(store: store)`,
  },
  {
    icon: Bot, name: "Kotlin / Android", file: "Main.kt", pkg: "packages/android", test: "gradle test",
    code: `val store = MemoryStore()
val hit = hitTest(x, y, BodyView.anterior)
store.add(NewObservation(hit!!.location, ObservationType.pain, intensity = 6.0))`,
    extra: <>Compose body map in <code>compose/BodyMap.kt</code></>,
  },
  {
    icon: Globe, name: "Web embed (no React required)", file: "index.html", pkg: "packages/embed", test: "pnpm test",
    code: `<health-twin-capture view="anterior" subject-id="u_123"></health-twin-capture>
<script>
  el.addEventListener("healthtwin:observation", (e) => {
    // persist e.detail in YOUR backend — you stay the data controller
  });
</script>`,
    extra: <>See the live widget on the <Link href="/embed" className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary">Embed</Link> tab.</>,
  },
];

export default function SdkPage() {
  return (
    <>
      <PageHeader eyebrow="SDK · Flutter · Swift · Kotlin" title="The same figure, in partner apps">
        Geometry lives in <code>packages/mobile/shapes.json</code>. Each native SDK only paints pixels and hit-tests.
        Stores are in-memory until you persist them in your own backend — same idea as the web embed events.
      </PageHeader>

      <div className="report-grid">
        {SDKS.map(({ icon: Icon, name, file, pkg, test, code, extra }, i) => (
          <Rise key={name} delay={0.05 + i * 0.06} as="section" className="card">
            <div className="card-head">
              <h2 className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" aria-hidden /></span>
                {name}
              </h2>
            </div>
            <CodeBlock title={file}>{code}</CodeBlock>
            <p className="muted mt-3">
              Package: <code>{pkg}</code> · <code>{test}</code>{extra ? <> · {extra}</> : null}
            </p>
          </Rise>
        ))}
      </div>
    </>
  );
}
