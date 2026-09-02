"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { getCloudConfig } from "./cloud";

const TABS = [
  { href: "/", label: "Capture" },
  { href: "/review", label: "Review" },
  { href: "/insights", label: "Insights" },
  { href: "/share", label: "Share" },
  { href: "/partner", label: "Partner" },
  { href: "/embed", label: "Embed" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const cloud = React.useMemo(() => getCloudConfig() != null, []);
  return (
    <>
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="brand"><span className="brand-mark" aria-hidden /> HealthTwin</span>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="app-status">{cloud ? "CLOUD" : "LOCAL"}</span>
            <ThemeToggle />
          </span>
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
