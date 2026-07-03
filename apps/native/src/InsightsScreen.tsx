import * as React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import type { Observation } from "@healthtwin/core";
import { summarize, templateNarrator } from "@healthtwin/insights";
import { correlateSymptomWithMetric, latest, type Sample, type SampleKind, type SampleStore } from "@healthtwin/vitals";
import { useNativeObservations } from "./nativeProvider";
import { useNativeVitals } from "./nativeVitals";
import { ScreenHeader, Card } from "./ui";
import { T } from "./theme";

const DEMO = {
  days: ["2026-06-26", "2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"],
  pain: [2, 3, 6, 7, 5, 8, 3],
  sleepMin: [450, 435, 330, 300, 360, 270, 450],
  steps: [8200, 7600, 5100, 4300, 6000, 3800, 9000],
};

function norm(xs: number[]): number[] {
  const min = Math.min(...xs), max = Math.max(...xs);
  const span = max - min || 1;
  return xs.map((v) => (v - min) / span);
}

function CorrelationNative({ observations, samples, kind }: { observations: Observation[]; samples: Sample[]; kind: SampleKind }) {
  const c = React.useMemo(() => correlateSymptomWithMetric(observations, samples, kind), [observations, samples, kind]);
  const label = kind.replace(/_/g, " ");
  if (c.pearson == null) return <Text style={st.muted}>Not enough overlapping days to correlate with {label}.</Text>;

  const mag = Math.abs(c.pearson);
  const strength = mag > 0.6 ? "strong" : mag > 0.3 ? "moderate" : "weak";
  const dir = c.pearson < 0 ? "inverse" : "direct";
  const W = 300, H = 70, pad = 6;
  const xAt = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, c.points.length - 1);
  const yFrom = (vals: number[]) => norm(vals).map((v) => pad + (1 - v) * (H - pad * 2));
  const symY = yFrom(c.points.map((p) => p.meanIntensity));
  const metY = yFrom(c.points.map((p) => p.metric));
  const poly = (ys: number[]) => c.points.map((_, i) => `${xAt(i).toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={st.verdict}>
        <Text style={{ fontWeight: "700" }}>{strength} {dir} correlation</Text> (r = {c.pearson.toFixed(2)}) between symptom intensity and {label} over {c.n} days.
      </Text>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Polyline points={poly(symY)} fill="none" stroke={T.heat} strokeWidth={2} />
        <Polyline points={poly(metY)} fill="none" stroke={T.cool} strokeWidth={2} />
      </Svg>
      <Text style={st.legend}>■ symptom   ■ {label}</Text>
    </View>
  );
}

export function InsightsScreen({ sampleStore }: { sampleStore: SampleStore }) {
  const { observations, add } = useNativeObservations();
  const { samples, addSample } = useNativeVitals(sampleStore);
  const [narrative, setNarrative] = React.useState("");

  const summary = React.useMemo(() => (observations.length ? summarize(observations) : null), [observations]);
  React.useEffect(() => {
    let live = true;
    if (summary) void templateNarrator().narrate(summary).then((n) => { if (live) setNarrative(n); });
    else setNarrative("");
    return () => { live = false; };
  }, [summary]);

  const kinds = React.useMemo(() => [...new Set(samples.map((s) => s.kind))], [samples]);

  const seed = async () => {
    for (let i = 0; i < DEMO.days.length; i++) {
      await add({ location: { regionId: "knee", side: "left", view: "anterior" }, type: "pain", intensity: DEMO.pain[i], occurredAt: `${DEMO.days[i]}T10:00:00.000Z` });
      await addSample({ kind: "sleep_minutes", value: DEMO.sleepMin[i], unit: "min", at: `${DEMO.days[i]}T23:00:00.000Z` }, "local");
      await addSample({ kind: "steps", value: DEMO.steps[i], unit: "count", at: `${DEMO.days[i]}T20:00:00.000Z` }, "local");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <ScreenHeader eyebrow="Insights" title="What moves the needle" subtitle="The pure engine — insights + vitals — running on-device." />

      <Pressable style={st.seed} onPress={seed}><Text style={st.seedText}>Seed a demo week</Text></Pressable>

      {summary ? (
        <>
          <Card title="Narrative"><Text style={st.body}>{narrative || "…"}</Text></Card>
          <Card title="Latest vitals">
            {kinds.length === 0 ? <Text style={st.muted}>No vitals yet — seed a demo week.</Text> : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {kinds.map((k) => {
                  const l = latest(samples, k);
                  return l ? <Text key={k} style={st.chip}>{k.replace(/_/g, " ")} {l.value} {l.unit}</Text> : null;
                })}
              </View>
            )}
          </Card>
          <Card title="Symptom × vitals correlation">
            {kinds.length === 0 ? <Text style={st.muted}>Add vitals to see how they track your symptoms.</Text> :
              kinds.map((k) => <CorrelationNative key={k} observations={observations} samples={samples} kind={k} />)}
          </Card>
        </>
      ) : (
        <Text style={st.muted}>Seed a demo week or capture a few entries to see insights.</Text>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  seed: { backgroundColor: T.ink, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignSelf: "flex-start", marginBottom: 14 },
  seedText: { color: "#fff", fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22, color: T.ink },
  muted: { color: T.muted, fontSize: 14 },
  chip: { fontSize: 12, color: T.ink, backgroundColor: "#f6f9fb", borderWidth: 1, borderColor: T.line, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  verdict: { fontSize: 14, color: T.ink, marginBottom: 6, lineHeight: 20 },
  legend: { fontSize: 11, color: T.muted, marginTop: 4 },
});
