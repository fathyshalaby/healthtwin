"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Capture" },
  { href: "/review", label: "Review" },
  { href: "/insights", label: "Insights" },
  { href: "/partner", label: "Partner" },
  { href: "/embed", label: "Embed" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  return (
    <>
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="brand"><span className="brand-mark" aria-hidden /> HealthTwin</span>
          <span className="app-status">LOCAL</span>
        </div>
        <nav className="seg-nav" aria-label="Sections">
          {TABS.map((t) => {
            const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={active ? "seg-tab active" : "seg-tab"}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </>
  );
}
