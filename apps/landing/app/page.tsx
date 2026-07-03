import { BodyPlate } from "../src/BodyPlate";

const GH = "https://github.com/fathyshalaby/healthtwin";

function Code({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="code">
      <div className="code-bar">
        <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
        <span style={{ marginLeft: 6 }}>{title}</span>
      </div>
      <pre>
        <code>
          {lines.map((l, i) => (
            <span key={i} className={l.trimStart().startsWith("//") ? "c-com" : undefined}>{l}{"\n"}</span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function SignalPlot() {
  const sleep = [7.5, 7, 5.5, 5, 6, 4.5, 7]; // hours
  const sym = [2, 3, 6, 7, 5, 8, 3]; // 0–10 intensity
  const W = 300, H = 152, padX = 16, padY = 18;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (sleep.length - 1);
  const ySleep = (v: number) => padY + (1 - (v - 4) / 4) * (H - padY * 2); // 4..8h
  const ySym = (v: number) => padY + (1 - v / 10) * (H - padY * 2); // 0..10
  const line = (arr: number[], y: (v: number) => number) =>
    arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const gy = (f: number) => padY + f * (H - padY * 2);
  return (
    <svg className="signal-plot" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Symptom intensity rises on the days sleep drops — a strong inverse correlation.">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} className="sg-grid" x1={padX} x2={W - padX} y1={gy(f)} y2={gy(f)} />
      ))}
      <polyline className="sg-sleep" points={line(sleep, ySleep)} />
      <polyline className="sg-sym" points={line(sym, ySym)} />
      {sleep.map((v, i) => <circle key={`s${i}`} className="d-sleep" cx={x(i)} cy={ySleep(v)} r={2.6} />)}
      {sym.map((v, i) => <circle key={`y${i}`} className="d-sym" cx={x(i)} cy={ySym(v)} r={2.6} />)}
    </svg>
  );
}

const webLines = [
  "// no framework required",
  "import { defineHealthTwinCapture }",
  '  from "@healthtwin/embed"',
  "defineHealthTwinCapture()",
  "",
  "<health-twin-capture",
  '  view="anterior" subject-id="u_123">',
  "</health-twin-capture>",
];

const reactLines = [
  "// or as a React component",
  "import { HealthTwinProvider, BodyMapCapture,",
  "  BodyMapReview, createIdbStore }",
  '  from "@healthtwin/react"',
  "",
  "<HealthTwinProvider store={createIdbStore()}",
  '  subjectId={userId} origin=\"app\">',
  "  <BodyMapCapture />",
  "  <BodyMapReview />",
  "</HealthTwinProvider>",
];

const stats = [
  { label: "Row-level security", icon: "🔒" },
  { label: "Offline-first architecture", icon: "📡" },
  { label: "HIPAA/GDPR ready", icon: "✓" },
  { label: "Zero framework required", icon: "⚡" },
];

export default function Home() {
  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <span className="brand"><span className="brand-mark" /> HealthTwin</span>
          <nav className="nav-links">
            <a href="#loop">How it works</a>
            <a href="#signal">Signal</a>
            <a href="#trust">Security</a>
            <a href={`${GH}#readme`}>Docs</a>
            <a className="btn btn-primary" href={GH}>Get the SDK →</a>
          </nav>
        </div>
      </header>

      <main>
        {/* ── hero ── */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow">FIG.01 — The twin</span>
              <h1>The body-map twin your product is <em>missing</em>.</h1>
              <p className="hero-sub">
                Users tap where it hurts and log how it feels. You get a structured, longitudinal
                record — with sync, consent-based sharing, and row-level security built in.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href={GH}>Get the SDK →</a>
                <a className="btn btn-ghost" href={`${GH}#readme`}>Read the docs</a>
              </div>
              <p className="hero-meta">
                <b>Apache-2.0</b> · local-first · web + native · <b>HIPAA / GDPR-aware</b>
              </p>
            </div>

            <div className="plate-panel">
              <div className="plate-panel-head"><span>Anterior · this week</span><b>SUBJECT u_123</b></div>
              <BodyPlate />
              <ol className="readout">
                <li><span className="rk-n">1</span> L. KNEE — sharp · 6/10 · <span className="rk-m">↑ 3× this week</span></li>
                <li><span className="rk-n">2</span> R. SHOULDER — ache · 3/10</li>
                <li><span className="rk-n">3</span> ABDOMEN — dull · 2/10 · <span className="rk-m">mornings</span></li>
              </ol>
            </div>
          </div>
        </section>

        {/* ── integrate ── */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">FIG.02 — Integrate</span>
              <h2>Drop it in. Keep the data in your stack, or ours.</h2>
              <p>No backend to build. Ship capture as a framework-agnostic web element or a React component — and receive every observation as an event if you'd rather stay the data controller.</p>
            </div>
            <div className="code-grid">
              <Code title="index.html" lines={webLines} />
              <Code title="App.tsx" lines={reactLines} />
            </div>
          </div>
        </section>

        {/* ── the loop ── */}
        <section className="section" id="loop">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">FIG.03 — The loop</span>
              <h2>Capture, sync, review — the whole cycle.</h2>
            </div>
            <div className="loop">
              <div className="step">
                <span className="step-n">01 · CAPTURE</span>
                <h3>Tap where it hurts</h3>
                <p>Front or back, a precise region — with type, quality, a 0–10 slider, a note, and the time it happened.</p>
              </div>
              <div className="step">
                <span className="step-n">02 · SYNC</span>
                <h3>Local-first, offline-safe</h3>
                <p>Captures work with no connection and sync through a pluggable backend. Immutable log — edits and deletes keep the history.</p>
              </div>
              <div className="step">
                <span className="step-n">03 · REVIEW</span>
                <h3>See the pattern</h3>
                <p>A heatmap by frequency, intensity, or recency, plus a timeline — what happened this week versus last month.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── signal ── */}
        <section className="section" id="signal">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">FIG.04 — Signal</span>
              <h2>Then read the signal the body&apos;s been sending.</h2>
              <p>Connect wearable and workout data, and HealthTwin lines it up against the symptom log — so &ldquo;my knee flares&rdquo; becomes &ldquo;flares track your worst-sleep nights.&rdquo; An AI narrative and tenant-scoped analytics come with it.</p>
            </div>
            <div className="signal-grid">
              <div className="plate-panel">
                <div className="plate-panel-head"><span>Knee pain × sleep · this week</span><b>r = −0.82</b></div>
                <SignalPlot />
                <div className="signal-legend">
                  <span><span className="dot" style={{ background: "var(--heat)" }} /> Symptom</span>
                  <span><span className="dot" style={{ background: "var(--cool)" }} /> Sleep hours</span>
                </div>
                <ol className="readout">
                  <li><span className="rk-n">↓</span> Nights under 6h → a next-day flare <span className="rk-m">4 of 5 times</span></li>
                  <li><span className="rk-n">AI</span> <span className="rk-m">&ldquo;Knee pain tracked closely with short sleep this week.&rdquo;</span></li>
                </ol>
              </div>
              <div className="signal-points">
                <div className="sig-point"><h4>Wearable ingestion</h4><p>HealthKit and Google Fit map straight into the record — heart rate, steps, energy, weight — a vitals stream beside the symptoms, offline-synced like everything else.</p></div>
                <div className="sig-point"><h4>AI clinical narrative</h4><p>An opt-in Claude summary turns the week into two factual, no-diagnosis sentences a clinician can skim — or a deterministic version with no model at all.</p></div>
                <div className="sig-point"><h4>Analytics &amp; webhooks</h4><p>Tenant-scoped cohort metrics for partners, plus HMAC-signed webhooks that push every new observation to your backend.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── trust ── */}
        <section className="section" id="trust">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">FIG.05 — Trust</span>
              <h2>Built for health data from the first commit.</h2>
              <p>Security isn't a later phase. It's the data model.</p>
            </div>
            <div className="trust">
              <div className="trust-item"><h4>Row-level security</h4><p>Postgres RLS scopes every read and write to its owner — nobody sees anyone else's rows by default.</p></div>
              <div className="trust-item"><h4>Consent-based sharing</h4><p>Grant a clinician access — scoped, time-boxed, revocable. Sharing is a grant, never a copy.</p></div>
              <div className="trust-item"><h4>Immutable + audited</h4><p>Observations are append-only (supersede / tombstone), so the clinical history — and the audit trail — stays intact.</p></div>
              <div className="trust-item"><h4>Multi-tenant</h4><p>A spoof-proof <code>partner_id</code> from the session claim keeps each partner's users isolated.</p></div>
              <div className="trust-item"><h4>Encryption helpers</h4><p>pgcrypto helpers for the free-text note, plus encrypted-at-rest storage and TLS in transit.</p></div>
              <div className="trust-item"><h4>Yours to leave with</h4><p>Bring your own backend, or keep data entirely in your system via capture events. Apache-2.0, no lock-in.</p></div>
            </div>
          </div>
        </section>

        {/* ── stats ── */}
        <section className="section stats-section">
          <div className="wrap">
            <div className="stats-grid">
              {stats.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── audience ── */}
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">FIG.06 — Who it's for</span>
              <h2>For the platforms people bring their bodies to.</h2>
            </div>
            <div className="aud">
              <div className="aud-card">
                <span className="eyebrow">Movement</span>
                <h3>Fitness &amp; physio platforms</h3>
                <p>Pilates, PT, coaching. Log home-exercise soreness and injuries, surface churn and re-injury signals, and show progress your members can feel.</p>
              </div>
              <div className="aud-card">
                <span className="eyebrow">Clinical</span>
                <h3>Clinics &amp; digital health</h3>
                <p>A between-visit record patients actually fill in — so a doctor opens the week and sees what happened, not a blank memory.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── cta ── */}
      <section className="cta">
        <div className="cta-inner">
          <span className="eyebrow">FIG.07 — Ship it</span>
          <h2>Give your users a body they can annotate.</h2>
          <div className="cta-actions">
            <a className="btn btn-primary" href={GH}>Get the SDK →</a>
            <a className="btn btn-ghost" href={`${GH}/issues/new`}>Join the waitlist</a>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-inner">
          <span>HealthTwin · Apache-2.0</span>
          <span>Built with the real SDK · <a href={GH}>GitHub ↗</a></span>
        </div>
      </footer>
    </>
  );
}
