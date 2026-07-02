import * as React from "react";
import { SafeAreaView, ActivityIndicator } from "react-native";
import * as SQLite from "expo-sqlite";
import { createSqliteStore, expoSqliteAdapter } from "@healthtwin/native";
import type { LocalStore } from "@healthtwin/core";
import { HealthTwinNativeProvider } from "./src/nativeProvider";
import { CaptureScreen } from "./src/CaptureScreen";

export default function App() {
  const [store, setStore] = React.useState<LocalStore | null>(null);

  React.useEffect(() => {
    void (async () => {
      const db = await SQLite.openDatabaseAsync("healthtwin.db");
      setStore(await createSqliteStore(expoSqliteAdapter(db)));
    })();
  }, []);

  if (!store) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HealthTwinNativeProvider store={store} subjectId="local-device" origin="expo">
        <CaptureScreen />
      </HealthTwinNativeProvider>
    </SafeAreaView>
  );
}
