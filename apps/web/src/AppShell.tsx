"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { getCloudConfig } from "./cloud";

const PRIMARY = [
  { href: "/", label: "Capture" },
  { href: "/review", label: "Review" },
  { href: "/insights", label: "Insights" },
  { href: "/report", label: "Report" },
];

const MORE = [
  { href: "/share", label: "Share" },
  { href: "/embed", label: "Embed" },
  { href: "/sdk", label: "App SDK" },
  { href: "/partner", label: "Partner" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const cloud = React.useMemo(() => getCloudConfig() != null, []);
  const moreActive = MORE.some((t) => path.startsWith(t.href));

  return (
    <>
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="brand"><span className="brand-mark" aria-hidden /> HealthTwin</span>
          <span className="app-bar-tools">
            <span className="app-status">{cloud ? "CLOUD" : "THIS DEVICE"}</span>
            <ThemeToggle />
          </span>
        </div>
        <nav className="seg-nav" aria-label="Sections">
          {PRIMARY.map((t) => {
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
          <details className={`seg-more ${moreActive ? "active" : ""}`}>
            <summary>More</summary>
            <div className="seg-more-menu">
              {MORE.map((t) => (
                <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "active" : undefined}>
                  {t.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
      </header>
      <main className="app-main">
        {children}
      </main>
    </>
  );
}
