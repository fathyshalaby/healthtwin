import * as React from "react";
import { View, Text, TextInput, Button, ScrollView } from "react-native";
import { getRegion, type Side, type BodyView } from "@healthtwin/core";
import { BodyMapNative } from "./BodyMapNative";
import { useNativeObservations } from "./nativeProvider";

export function CaptureScreen() {
  const { observations, add } = useNativeObservations();
  const [sel, setSel] = React.useState<{ regionId: string; side: Side; view: BodyView } | null>(null);
  const [intensity, setIntensity] = React.useState("5");

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>HealthTwin</Text>

      <BodyMapNative
        view="anterior"
        onSelect={(s) => setSel({ regionId: s.regionId, side: s.side, view: "anterior" })}
      />

      {sel && (
        <View style={{ gap: 8 }}>
          <Text>{getRegion(sel.regionId)?.label ?? sel.regionId}</Text>
          <TextInput
            keyboardType="numeric"
            value={intensity}
            onChangeText={setIntensity}
            style={{ borderWidth: 1, padding: 8 }}
          />
          <Button
            title="Save"
            onPress={async () => {
              await add({
                location: { regionId: sel.regionId, side: sel.side, view: sel.view },
                type: "pain",
                intensity: Number(intensity),
              });
              setSel(null);
            }}
          />
        </View>
      )}

      <Text style={{ marginTop: 16, fontWeight: "600" }}>Entries ({observations.length})</Text>
      {observations.map((o) => (
        <Text key={o.id}>
          {getRegion(o.location.regionId)?.label ?? o.location.regionId} — {o.type}
          {o.intensity != null ? ` (${o.intensity}/10)` : ""}
        </Text>
      ))}
    </ScrollView>
  );
}
