"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Ellipsis, FileText, Flame, PersonStanding, Share2, Smartphone, Sparkles, SquareCode } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import dynamic from "next/dynamic";
import { PaletteTrigger } from "./PaletteTrigger";
import { getCloudConfig } from "./cloud";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// cmdk + its dialog only download the first time the palette is opened.
const CommandPalette = dynamic(() => import("./CommandPalette").then((mod) => mod.CommandPalette), { ssr: false });

const PRIMARY = [
  { href: "/", label: "Capture", icon: PersonStanding },
  { href: "/review", label: "Review", icon: Flame },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/report", label: "Report", icon: FileText },
];

const MORE = [
  { href: "/share", label: "Share", icon: Share2 },
  { href: "/embed", label: "Embed", icon: SquareCode },
  { href: "/sdk", label: "App SDK", icon: Smartphone },
  { href: "/partner", label: "Partner", icon: Building2 },
];

/**
 * One lone thumb that slides under whichever nav item is active: measure the active item, move the thumb with a
 * CSS transition. (No animation library in the layout bundle; it's the same morph, springy cubic-bezier.)
 */
function useThumb(activeKey: string) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [box, setBox] = React.useState<{ x: number; w: number } | null>(null);
  const [armed, setArmed] = React.useState(false);
  React.useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const measure = () => {
      const el = c.querySelector<HTMLElement>('[aria-current="page"], [data-active="true"]');
      setBox(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(c);
    // enable the slide only after the first placement, so the thumb doesn't fly in from the corner on load
    const raf = requestAnimationFrame(() => setArmed(true));
    return () => { ro?.disconnect(); cancelAnimationFrame(raf); };
  }, [activeKey]);
  const style: React.CSSProperties | undefined = box
    ? { width: box.w, transform: `translateX(${box.x}px)`, opacity: 1 }
    : undefined;
  return { ref, style, armed };
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** More-menu items, shared by the desktop pill and the mobile dock. */
function MoreItems({ path }: { path: string }) {
  return (
    <>
      {MORE.map(({ href, label, icon: Icon }) => (
        <DropdownMenuItem key={href} asChild>
          <Link href={href} aria-current={isActive(path, href) ? "page" : undefined} className={isActive(path, href) ? "font-semibold text-primary" : undefined}>
            <Icon />
            {label}
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const cloud = React.useMemo(() => getCloudConfig() != null, []);
  const moreActive = MORE.some((t) => isActive(path, t.href));
  const activeKey = path.split("/")[1] || "home";
  const navThumb = useThumb(activeKey);
  const dockThumb = useThumb(activeKey);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [paletteUsed, setPaletteUsed] = React.useState(false);
  React.useEffect(() => { if (paletteOpen) setPaletteUsed(true); }, [paletteOpen]);

  // ⌘K / Ctrl-K from anywhere.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="HealthTwin home">
            <span className="brand-mark" aria-hidden />
            HealthTwin
          </Link>

          {/* desktop: one pill, one sliding thumb */}
          <nav className="nav-pill" aria-label="Sections" ref={navThumb.ref as React.RefObject<HTMLElement>}>
            <span className="nav-thumb" data-armed={navThumb.armed ? "" : undefined} style={navThumb.style} aria-hidden="true" />
            {PRIMARY.map((t) => {
              const active = isActive(path, t.href);
              return (
                <Link key={t.href} href={t.href} className="nav-link" aria-current={active ? "page" : undefined}>
                  {t.label}
                </Link>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger className="nav-link" data-active={moreActive}>
                More
                <Ellipsis className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10}>
                <MoreItems path={path} />
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="top-tools">
            <PaletteTrigger onClick={() => setPaletteOpen(true)} />
            <span className="status-chip" data-mode={cloud ? "cloud" : "local"}>
              {cloud ? "Cloud" : "This device"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      {/* mobile: floating dock */}
      <nav className="dock" aria-label="Sections" ref={dockThumb.ref as React.RefObject<HTMLElement>}>
        <span className="dock-thumb" data-armed={dockThumb.armed ? "" : undefined} style={dockThumb.style} aria-hidden="true" />
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} className="dock-item" aria-current={active ? "page" : undefined}>
              <Icon aria-hidden />
              {label}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger className="dock-item" data-active={moreActive}>
            <Ellipsis aria-hidden />
            More
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={12}>
            <MoreItems path={path} />
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {paletteUsed && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
    </>
  );
}
