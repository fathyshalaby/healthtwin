import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { shapesFor, VIEWBOX, type RegionShape } from "@healthtwin/bodymap-core";
import type { BodyView, RegionKey, Side } from "@healthtwin/core";

// Same headless geometry as the web body map, rendered with react-native-svg.
export function BodyMapNative({
  view, onSelect,
}: {
  view: BodyView;
  onSelect: (sel: { key: RegionKey; regionId: string; side: Side }) => void;
}) {
  const shapes = shapesFor(view);
  return (
    <Svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} width="100%" height={400}>
      {shapes.map((s: RegionShape) => (
        <Path
          key={s.key}
          d={s.d}
          fill="#cbd5e1"
          stroke="#334155"
          strokeWidth={1}
          onPress={() => onSelect({ key: s.key, regionId: s.regionId, side: s.side })}
        />
      ))}
    </Svg>
  );
}
