import * as React from "react";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { shapesFor, hitTestShapes, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";
import type { BodyView, RegionKey, Side } from "@healthtwin/core";
import { T } from "./theme";

/**
 * Same headless geometry — and the same hit-testing rule — as the web body map, rendered with react-native-svg.
 * A press on a region is that region (exact shapes, no fat invisible strokes that let a neighbour steal it);
 * a near miss lands on the wrapping Pressable and goes to the nearest region via `hitTestShapes`.
 */
export function BodyMapNative({
  view, onSelect, selectedKey, shading, height = 380,
}: {
  view: BodyView;
  onSelect: (sel: { key: RegionKey; regionId: string; side: Side }) => void;
  selectedKey?: RegionKey;
  shading?: Map<RegionKey, string>;
  height?: number;
}) {
  const shapes = shapesFor(view);
  const [size, setSize] = React.useState({ w: 0, h: height });
  const pick = (s: RegionShape) => onSelect({ key: s.key, regionId: s.regionId, side: s.side });

  // Pressable-local points → viewBox units (the Svg letterboxes the 200×400 viewBox, xMidYMid meet).
  const toUser = (lx: number, ly: number) => {
    if (!size.w || !size.h) return null;
    const scale = Math.min(size.w / VIEWBOX.w, size.h / VIEWBOX.h);
    return { x: (lx - (size.w - VIEWBOX.w * scale) / 2) / scale, y: (ly - (size.h - VIEWBOX.h * scale) / 2) / scale };
  };

  return (
    <Pressable
      accessible={false}
      style={{ width: "100%", height }}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPress={(e) => {
        const p = toUser(e.nativeEvent.locationX, e.nativeEvent.locationY);
        const s = p ? hitTestShapes(shapes, p.x, p.y) : null;
        if (s) pick(s);
      }}
    >
      <Svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} width="100%" height="100%">
        {shapes.map((s: RegionShape) => (
          <Path
            key={s.key}
            d={s.d}
            fill={selectedKey === s.key ? T.cool : (shading?.get(s.key) ?? T.bodyFill)}
            stroke={selectedKey === s.key ? T.cool : T.bodyStroke}
            strokeWidth={selectedKey === s.key ? 2 : 1}
            onPress={() => pick(s)}
          />
        ))}
      </Svg>
    </Pressable>
  );
}
