import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { T, intensityColor, radius } from "./theme";

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={s.h1}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[s.card, style]}>
      {title ? <Text style={s.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Segmented<V extends string>({ options, value, onChange }: {
  options: { label: string; value: V }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.segTab, active && s.segTabActive]}>
            <Text style={[s.segText, active && s.segTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Interactive 0–10 intensity picker as a row of spectrum dots. */
export function IntensityDots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={s.dotRow}>
        {Array.from({ length: 11 }, (_, i) => (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}
            style={[s.dot, { backgroundColor: i <= value ? intensityColor(value) : T.lineSoft }]} />
        ))}
      </View>
      <Text style={[s.dotVal, { color: intensityColor(value) }]}>{value}<Text style={s.dotValSmall}> / 10</Text></Text>
    </View>
  );
}

/** Read-only intensity meter for entry rows. */
export function IntensityMeter({ value }: { value: number }) {
  return (
    <View style={s.meterWrap}>
      <View style={s.meterTrack}>
        <View style={[s.meterFill, { width: `${value * 10}%`, backgroundColor: intensityColor(value) }]} />
      </View>
      <Text style={[s.meterVal, { color: intensityColor(value) }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { color: T.cool, fontSize: 11, letterSpacing: 1.6, fontWeight: "700" },
  h1: { color: T.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: T.muted, fontSize: 14.5, marginTop: 6, lineHeight: 21 },
  card: { backgroundColor: T.paper, borderColor: T.line, borderWidth: 1, borderRadius: radius, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: T.ink, marginBottom: 10 },
  seg: { flexDirection: "row", backgroundColor: "#eef3f7", borderColor: T.line, borderWidth: 1, borderRadius: 12, padding: 3, gap: 3, alignSelf: "flex-start" },
  segTab: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 9 },
  segTabActive: { backgroundColor: T.paper },
  segText: { color: T.muted, fontWeight: "600", fontSize: 13 },
  segTextActive: { color: T.cool },
  chip: { borderColor: T.line, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 13 },
  chipActive: { borderColor: T.cool, backgroundColor: "rgba(37,99,235,0.10)" },
  chipText: { color: T.ink, fontSize: 13.5, textTransform: "capitalize" },
  chipTextActive: { color: T.cool },
  dotRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { flex: 1, height: 16, borderRadius: 8 },
  dotVal: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  dotValSmall: { fontSize: 13, color: T.muted, fontWeight: "500" },
  meterWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  meterTrack: { width: 70, height: 7, borderRadius: 999, backgroundColor: "#e7edf2", overflow: "hidden" },
  meterFill: { height: "100%", borderRadius: 999 },
  meterVal: { fontSize: 13, fontWeight: "700", minWidth: 18 },
});
