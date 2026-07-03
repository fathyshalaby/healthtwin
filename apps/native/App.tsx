import * as React from "react";
import { SafeAreaView, View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SQLite from "expo-sqlite";
import { createSqliteStore, createSqliteSampleStore, expoSqliteAdapter } from "@healthtwin/native";
import type { LocalStore } from "@healthtwin/core";
import type { SampleStore } from "@healthtwin/vitals";
import { HealthTwinNativeProvider } from "./src/nativeProvider";
import { CaptureScreen } from "./src/CaptureScreen";
import { ReviewScreen } from "./src/ReviewScreen";
import { InsightsScreen } from "./src/InsightsScreen";
import { T } from "./src/theme";

type Tab = "capture" | "review" | "insights";
const TABS: { key: Tab; label: string }[] = [
  { key: "capture", label: "Capture" },
  { key: "review", label: "Review" },
  { key: "insights", label: "Insights" },
];

export default function App() {
  const [obsStore, setObsStore] = React.useState<LocalStore | null>(null);
  const [sampleStore, setSampleStore] = React.useState<SampleStore | null>(null);
  const [tab, setTab] = React.useState<Tab>("capture");

  React.useEffect(() => {
    void (async () => {
      const db = await SQLite.openDatabaseAsync("healthtwin.db");
      const adapter = expoSqliteAdapter(db);
      setObsStore(await createSqliteStore(adapter));
      setSampleStore(await createSqliteSampleStore(adapter));
    })();
  }, []);

  if (!obsStore || !sampleStore) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={T.cool} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.canvas }}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <View style={styles.mark} />
          <Text style={styles.brand}>HealthTwin</Text>
        </View>
        <Text style={styles.status}>● LOCAL</Text>
      </View>

      <HealthTwinNativeProvider store={obsStore} subjectId="local-device" origin="expo">
        <View style={{ flex: 1 }}>
          {tab === "capture" ? <CaptureScreen /> : null}
          {tab === "review" ? <ReviewScreen /> : null}
          {tab === "insights" ? <InsightsScreen sampleStore={sampleStore} /> : null}
        </View>
      </HealthTwinNativeProvider>

      <View style={styles.tabbar}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.canvas },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line },
  mark: { width: 11, height: 22, borderRadius: 6, backgroundColor: T.cool },
  brand: { fontSize: 18, fontWeight: "800", color: T.ink, letterSpacing: -0.3 },
  status: { fontSize: 11, letterSpacing: 1.2, color: T.mint, fontWeight: "600" },
  tabbar: { flexDirection: "row", borderTopWidth: 1, borderTopColor: T.line, backgroundColor: T.paper },
  tab: { flex: 1, alignItems: "center", paddingVertical: 13 },
  tabText: { color: T.muted, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: T.cool },
});
