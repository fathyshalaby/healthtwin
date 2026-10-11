"use client";
import * as React from "react";

/** House easing — fast out, long settle. */
export const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Fade + rise on mount, in pure CSS: it starts at first paint (before React hydrates, so no flash) and costs
 * no JS. Deliberately mount-based, not scroll-triggered, so print and full-page capture never meet content
 * stuck at opacity 0. `prefers-reduced-motion` is honoured globally in globals.css.
 */
export function Rise({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  /** kept for API compatibility; the distance is a CSS token now */
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "header";
  "data-tone"?: string;
  "data-compact"?: string;
}) {
  return (
    <Tag
      className={className ? `rise ${className}` : "rise"}
      style={delay ? ({ "--rise-delay": `${delay}s` } as React.CSSProperties) : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Ease-out-quart: fast start, long settle — the same feel as the house cubic-bezier. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** requestAnimationFrame tween from→to over `seconds`. Returns a cancel function. */
function tween(from: number, to: number, seconds: number, onUpdate: (v: number) => void, onDone: () => void) {
  const t0 = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / (seconds * 1000));
    onUpdate(from + (to - from) * easeOut(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone();
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

/** True once the element has entered the viewport (one-shot). */
function useSeen(ref: React.RefObject<Element | null>, rootMargin = "0px 0px -10% 0px") {
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);
  return seen;
}

const fmt = (n: number, decimals: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * A number that counts up to `value` the first time it scrolls into view, then tweens between
 * later values. The server (and reduced-motion users) get the final number — no layout shift.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 0.9,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useSeen(ref);
  const reduce = usePrefersReducedMotion();
  const from = React.useRef<number | null>(null);

  // Zero the label before first paint (client only) so the count starts from 0, not from the final value.
  React.useLayoutEffect(() => {
    if (reduce || from.current !== null || !ref.current) return;
    ref.current.textContent = fmt(0, decimals);
    from.current = 0;
  }, [reduce, decimals]);

  // Printing (or saving to PDF) must never capture a half-counted or still-zero number.
  React.useEffect(() => {
    const finish = () => { if (ref.current) ref.current.textContent = fmt(value, decimals); };
    window.addEventListener("beforeprint", finish);
    return () => window.removeEventListener("beforeprint", finish);
  }, [value, decimals]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value, decimals);
      return;
    }
    if (!inView) return;
    const cancel = tween(
      from.current ?? 0, value, duration,
      (v) => { el.textContent = fmt(v, decimals); },
      () => { el.textContent = fmt(value, decimals); },
    );
    from.current = value;
    return cancel;
  }, [value, inView, reduce, decimals, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {fmt(value, decimals)}
    </span>
  );
}

/** A tiny trend line that wipes in left-to-right (CSS). Values are scaled to the box; purely decorative. */
export function Sparkline({
  values,
  tone = "var(--primary)",
  className,
}: {
  values: number[];
  tone?: string;
  className?: string;
}) {
  // Hooks first — the early return below must come after every hook call.
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  if (values.length < 2) return null;
  const W = 120, H = 30, pad = 3;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `${x(0)},${H} ${pts.join(" ")} ${x(values.length - 1)},${H}`;
  return (
    <svg className={className ? `spark wipe ${className}` : "spark wipe"} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0.28" />
          <stop offset="1" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={tone} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
