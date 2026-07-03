import * as React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { computeHeatmap, buildTimeline, getRegion, type BodyView, type HeatmapMetric } from "@healthtwin/core";
import { shadingFor } from "@healthtwin/bodymap-core";
import { BodyMapNative } from "./BodyMapNative";
import { useNativeObservations } from "./nativeProvider";
import { ScreenHeader, Card, Segmented } from "./ui";
import { T } from "./theme";

export function ReviewScreen() {
  const { observations } = useNativeObservations();
  const [view, setView] = React.useState<BodyView>("anterior");
  const [metric, setMetric] = React.useState<HeatmapMetric>("frequency");

  const shading = React.useMemo(
    () => shadingFor(computeHeatmap(observations, { metric })),
    [observations, metric],
  );
  const days = React.useMemo(() => buildTimeline(observations, {}), [observations]);

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <ScreenHeader eyebrow="Review" title="See the pattern" subtitle="A heat map and a timeline — this week versus last month." />

      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Segmented options={[{ label: "Front", value: "anterior" }, { label: "Back", value: "posterior" }]} value={view} onChange={setView} />
          <Segmented
            options={[{ label: "Freq", value: "frequency" }, { label: "Mean", value: "meanIntensity" }, { label: "Recent", value: "recency" }]}
            value={metric} onChange={setMetric}
          />
        </View>
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <BodyMapNative view={view} shading={shading} onSelect={() => undefined} />
        </View>
        <Text style={st.legend}>COOLER = LESS · WARMER = MORE</Text>
      </Card>

      {days.length === 0 ? (
        <Text style={st.empty}>Nothing logged yet.</Text>
      ) : (
        days.map((d) => (
          <View key={d.date} style={st.day}>
            <Text style={st.date}>{d.date}</Text>
            {d.items.map((o) => (
              <View key={o.id} style={st.row}>
                <Text style={st.rowRegion}>{getRegion(o.location.regionId)?.label ?? o.location.regionId}</Text>
                <Text style={st.rowMeta}>{o.type}{o.intensity != null ? ` · ${o.intensity}/10` : ""}</Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  legend: { fontSize: 11, letterSpacing: 0.8, color: T.muted, marginTop: 10, fontWeight: "600" },
  empty: { color: T.muted, fontSize: 14.5 },
  day: { borderLeftWidth: 2, borderLeftColor: T.line, paddingLeft: 14, marginLeft: 4, marginBottom: 6 },
  date: { fontSize: 12, letterSpacing: 0.4, color: T.muted, textTransform: "uppercase", fontWeight: "700", marginVertical: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: T.paper, borderWidth: 1, borderColor: T.line, borderRadius: 10, padding: 11, marginBottom: 6 },
  rowRegion: { fontWeight: "600", color: T.ink },
  rowMeta: { color: T.muted, fontSize: 13 },
});
