import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { shapesFor, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";
import type { BodyView, RegionKey, Side } from "@healthtwin/core";
import { T } from "./theme";

// Same headless geometry as the web body map, rendered with react-native-svg.
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
  return (
    <Svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} width="100%" height={height}>
      {shapes.map((s: RegionShape) => (
        <Path
          key={s.key}
          d={s.d}
          fill={selectedKey === s.key ? T.cool : (shading?.get(s.key) ?? "#cbd5e1")}
          stroke={selectedKey === s.key ? T.cool : "#334155"}
          strokeWidth={selectedKey === s.key ? 2 : 1}
          onPress={() => onSelect({ key: s.key, regionId: s.regionId, side: s.side })}
        />
      ))}
    </Svg>
  );
}
