"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { getCloudConfig } from "./cloud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
      <header className="app-bar sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-3 sm:px-6">
          <span className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight">
            <span className="brand-mark" aria-hidden />
            HealthTwin
          </span>
          <span className="flex items-center gap-2">
            <Badge variant="outline" className="app-status gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
              {cloud ? "CLOUD" : "THIS DEVICE"}
            </Badge>
            <ThemeToggle />
          </span>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6" aria-label="Sections">
          {PRIMARY.map((t) => {
            const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Button
                key={t.href}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={cn("flex-1 sm:flex-none", active && "shadow-sm")}
                asChild
              >
                <Link href={t.href} aria-current={active ? "page" : undefined}>
                  {t.label}
                </Link>
              </Button>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={moreActive ? "secondary" : "ghost"}
                size="sm"
                className={cn("flex-none", moreActive && "shadow-sm")}
              >
                More
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {MORE.map((t) => (
                <DropdownMenuItem key={t.href} asChild>
                  <Link href={t.href} className={path.startsWith(t.href) ? "font-medium" : undefined}>
                    {t.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>
      <main className="app-main mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6">{children}</main>
    </>
  );
}
