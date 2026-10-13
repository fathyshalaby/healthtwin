"use client";
import { useEffect } from "react";

/**
 * One-shot scroll reveals. Hides `.reveal` elements only after JS is confirmed running (so no-JS,
 * crawlers and print always see everything), reveals each once as it enters the viewport, and
 * stands down entirely for reduced-motion users.
 */
export function Reveals() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
  return null;
}
