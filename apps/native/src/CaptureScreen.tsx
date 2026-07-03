import * as React from "react";
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { getRegion, type ObservationType, type Quality, type Side, type BodyView } from "@healthtwin/core";
import { BodyMapNative } from "./BodyMapNative";
import { useNativeObservations } from "./nativeProvider";
import { ScreenHeader, Card, Segmented, Chip, IntensityDots, IntensityMeter } from "./ui";
import { T, radius } from "./theme";

const TYPES: ObservationType[] = ["pain", "stiffness", "numbness", "tingling", "swelling", "weakness", "other"];
const QUALITIES: Quality[] = ["sharp", "dull", "burning", "throbbing", "aching", "stabbing", "cramping"];

export function CaptureScreen() {
  const { observations, add } = useNativeObservations();
  const [view, setView] = React.useState<BodyView>("anterior");
  const [sel, setSel] = React.useState<{ regionId: string; side: Side } | null>(null);
  const [type, setType] = React.useState<ObservationType>("pain");
  const [quality, setQuality] = React.useState<Quality[]>([]);
  const [intensity, setIntensity] = React.useState(5);

  const open = (s: { regionId: string; side: Side }) => {
    setType("pain"); setQuality([]); setIntensity(5); setSel(s);
  };
  const toggleQ = (q: Quality) => setQuality((c) => (c.includes(q) ? c.filter((x) => x !== q) : [...c, q]));
  const save = async () => {
    if (!sel) return;
    await add({
      location: { regionId: sel.regionId, side: sel.side, view },
      type, quality: quality.length ? quality : undefined, intensity,
    });
    setSel(null);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <ScreenHeader eyebrow="Capture" title="Tap where it hurts" subtitle="Log how it feels — it becomes a longitudinal record." />

      <Card>
        <Segmented options={[{ label: "Front", value: "anterior" }, { label: "Back", value: "posterior" }]} value={view} onChange={(v) => { setView(v); setSel(null); }} />
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <BodyMapNative view={view} onSelect={(s) => open({ regionId: s.regionId, side: s.side })} />
        </View>
      </Card>

      <Text style={st.entriesHead}>Entries <Text style={st.count}>{observations.length}</Text></Text>
      {observations.length === 0 ? (
        <Text style={st.empty}>No entries yet. Tap a region above to log the first one.</Text>
      ) : (
        observations.map((o) => (
          <View key={o.id} style={st.entry}>
            <View style={{ flex: 1 }}>
              <Text style={st.region}>{getRegion(o.location.regionId)?.label ?? o.location.regionId}</Text>
              <Text style={st.type}>{o.type}</Text>
            </View>
            {o.intensity != null ? <IntensityMeter value={o.intensity} /> : null}
          </View>
        ))
      )}

      <Modal visible={!!sel} animationType="slide" transparent onRequestClose={() => setSel(null)}>
        <Pressable style={st.backdrop} onPress={() => setSel(null)}>
          <Pressable style={st.sheet} onPress={() => undefined}>
            <View style={st.grab} />
            <Text style={st.sheetTitle}>{sel ? getRegion(sel.regionId)?.label ?? sel.regionId : ""}</Text>

            <Text style={st.label}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 2 }}>
              {TYPES.map((t) => <Chip key={t} label={t} active={type === t} onPress={() => setType(t)} />)}
            </ScrollView>

            <Text style={st.label}>QUALITY</Text>
            <View style={st.chipWrap}>
              {QUALITIES.map((q) => <Chip key={q} label={q} active={quality.includes(q)} onPress={() => toggleQ(q)} />)}
            </View>

            <Text style={st.label}>INTENSITY</Text>
            <IntensityDots value={intensity} onChange={setIntensity} />

            <Pressable style={st.saveBtn} onPress={save}><Text style={st.saveText}>Save</Text></Pressable>
            <Pressable style={st.cancelBtn} onPress={() => setSel(null)}><Text style={st.cancelText}>Cancel</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  entriesHead: { fontSize: 15, fontWeight: "700", color: T.ink, marginTop: 8, marginBottom: 10 },
  count: { color: T.muted, fontWeight: "500" },
  empty: { color: T.muted, fontSize: 14.5, backgroundColor: T.paper, borderWidth: 1, borderColor: T.line, borderStyle: "dashed", borderRadius: 13, padding: 22, textAlign: "center" },
  entry: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.paper, borderWidth: 1, borderColor: T.line, borderRadius: 13, padding: 14, marginBottom: 10 },
  region: { fontSize: 16, fontWeight: "700", color: T.ink },
  type: { fontSize: 11, letterSpacing: 0.6, color: T.cool, textTransform: "uppercase", marginTop: 3, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(11,22,34,0.42)", justifyContent: "flex-end" },
  sheet: { backgroundColor: T.paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32, gap: 4 },
  grab: { width: 40, height: 4, borderRadius: 999, backgroundColor: T.line, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 21, fontWeight: "800", color: T.ink, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4, color: T.muted, textTransform: "uppercase", marginTop: 14, marginBottom: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  saveBtn: { backgroundColor: T.ink, borderRadius: radius, paddingVertical: 14, alignItems: "center", marginTop: 22 },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: "center", marginTop: 6 },
  cancelText: { color: T.muted, fontWeight: "600" },
});
