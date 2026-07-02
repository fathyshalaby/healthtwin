import { shapesFor, heatColor, VIEWBOX } from "@healthtwin/bodymap-core";

// A demo heat overlay for the hero — the product's own geometry, shaded.
const HEAT: Record<string, number> = {
  "knee:left:anterior": 0.95,
  "shoulder:right:anterior": 0.55,
  "abdomen:central:anterior": 0.3,
};

const PINS: { key: string; n: number }[] = [
  { key: "knee:left:anterior", n: 1 },
  { key: "shoulder:right:anterior", n: 2 },
  { key: "abdomen:central:anterior", n: 3 },
];

export function BodyPlate() {
  const shapes = shapesFor("anterior");
  const byKey = Object.fromEntries(shapes.map((s) => [s.key, s] as const));

  return (
    <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} className="plate" role="img" aria-label="Body map with a heat overlay: left knee marked highest">
      <g className="plate-grid" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 50} x2={VIEWBOX.w} y2={i * 50} />)}
        {Array.from({ length: 5 }).map((_, i) => <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VIEWBOX.h} />)}
      </g>
      {shapes.map((s) => {
        const h = HEAT[s.key];
        return (
          <path
            key={s.key}
            d={s.d}
            fill={h != null ? heatColor(h) : "#E3EBF0"}
            stroke="#9FB2BE"
            strokeWidth={0.8}
            className={h != null ? "plate-hot" : undefined}
          />
        );
      })}
      {PINS.map((p) => {
        const s = byKey[p.key];
        if (!s) return null;
        const cx = s.bbox.x + s.bbox.w / 2;
        const cy = s.bbox.y + s.bbox.h / 2;
        return (
          <g key={p.n} aria-hidden="true">
            <circle cx={cx} cy={cy} r={8.5} className="plate-pin" />
            <text x={cx} y={cy + 3.4} textAnchor="middle" className="plate-pin-n">{p.n}</text>
          </g>
        );
      })}
    </svg>
  );
}
