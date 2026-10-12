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
      <defs>
        {/* top-light → bottom-shade so the flat geometry reads as volume */}
        <radialGradient id="plateLight" gradientUnits="userSpaceOnUse" cx="70" cy="40" r="360">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".25" />
        </radialGradient>
        <mask id="plateBody" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEWBOX.w} height={VIEWBOX.h}>
          {shapes.map((s) => <path key={s.key} d={s.d} fill="#fff" />)}
        </mask>
        <linearGradient id="scanGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VIEWBOX.w} y2="0">
          <stop offset="0" stopColor="#7fb0ff" stopOpacity="0" />
          <stop offset=".5" stopColor="#9fc2ff" stopOpacity=".9" />
          <stop offset="1" stopColor="#7fb0ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="plate-grid" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 50} x2={VIEWBOX.w} y2={i * 50} />)}
        {Array.from({ length: 5 }).map((_, i) => <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VIEWBOX.h} />)}
      </g>
      {/* one silhouette: outline pass beneath borderless fills, then a single light over the whole body */}
      <g className="plate-outline" aria-hidden="true">
        {shapes.map((s) => <path key={s.key} d={s.d} />)}
      </g>
      {shapes.map((s) => {
        const h = HEAT[s.key];
        const c = h != null ? heatColor(h) : undefined;
        return (
          <path
            key={s.key}
            d={s.d}
            className={h != null ? "plate-cell plate-hot" : "plate-cell"}
            style={c ? { fill: c, color: c } : undefined}
          />
        );
      })}
      <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#plateLight)" mask="url(#plateBody)" />
      <line className="plate-scan" x1={0} x2={VIEWBOX.w} y1={0} y2={0} aria-hidden="true" />
      {PINS.map((p) => {
        const s = byKey[p.key];
        if (!s) return null;
        const cx = s.bbox.x + s.bbox.w / 2;
        const cy = s.bbox.y + s.bbox.h / 2;
        return (
          <g key={p.n} aria-hidden="true">
            <circle cx={cx} cy={cy} r={8.5} className="plate-ping" />
            <circle cx={cx} cy={cy} r={8.5} className="plate-pin" />
            <text x={cx} y={cy + 3.4} textAnchor="middle" className="plate-pin-n">{p.n}</text>
          </g>
        );
      })}
    </svg>
  );
}
