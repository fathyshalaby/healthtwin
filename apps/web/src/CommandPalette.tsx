"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2, Download, ExternalLink, FileText, Flame, Moon, PersonStanding, Search, Share2, Smartphone, Sparkles, SquareCode, Sun,
} from "lucide-react";
import { applyTheme, currentTheme } from "./ThemeToggle";

const GITHUB = "https://github.com/fathyshalaby/healthtwin";

export const SECTIONS = [
  { href: "/", label: "Capture", hint: "Log how it feels", icon: PersonStanding, keywords: "body map symptom log tap" },
  { href: "/review", label: "Review", hint: "Heatmap & timeline", icon: Flame, keywords: "heatmap timeline history pattern" },
  { href: "/insights", label: "Insights", hint: "What moves the needle", icon: Sparkles, keywords: "correlation vitals sleep narrative" },
  { href: "/report", label: "Report", hint: "Print for a clinician", icon: FileText, keywords: "pdf print clinician summary" },
  { href: "/share", label: "Share", hint: "Consent grants", icon: Share2, keywords: "clinician access grant revoke" },
  { href: "/embed", label: "Embed", hint: "Web component demo", icon: SquareCode, keywords: "widget sdk partner web component" },
  { href: "/sdk", label: "App SDK", hint: "Flutter · Swift · Kotlin", icon: Smartphone, keywords: "native mobile flutter swift kotlin" },
  { href: "/partner", label: "Partner", hint: "Cohort analytics", icon: Building2, keywords: "dashboard cohort analytics tenant" },
] as const;

/** ⌘K / Ctrl-K palette: jump anywhere, flip the theme, export the twin. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    if (open) setDark(currentTheme() === "dark");
  }, [open]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    // Let the dialog start closing first so focus restoration doesn't fight the navigation.
    setTimeout(fn, 0);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      loop
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-wrap"
    >
      <div className="cmdk">
        <Command.Input className="cmdk-input" placeholder="Jump to a page or run an action…" />
        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">Nothing matches that.</Command.Empty>

          <Command.Group heading="Go to" className="cmdk-group">
            {SECTIONS.map(({ href, label, hint, icon: Icon, keywords }) => (
              <Command.Item key={href} value={`${label} ${keywords}`} className="cmdk-item" onSelect={() => run(() => router.push(href))}>
                <Icon aria-hidden />
                {label}
                <span className="hint">{hint}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Actions" className="cmdk-group">
            <Command.Item
              value="toggle theme dark light mode appearance"
              className="cmdk-item"
              onSelect={() => run(() => { applyTheme(dark ? "light" : "dark"); window.dispatchEvent(new Event("ht:theme")); })}
            >
              {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
              Switch to {dark ? "light" : "dark"} mode
            </Command.Item>
            <Command.Item
              value="download export json backup twin"
              className="cmdk-item"
              onSelect={() => run(() => window.dispatchEvent(new Event("ht:export")))}
            >
              <Download aria-hidden />
              Download my twin as JSON
            </Command.Item>
            <Command.Item
              value="github source code docs repository"
              className="cmdk-item"
              onSelect={() => run(() => window.open(GITHUB, "_blank", "noopener,noreferrer"))}
            >
              <ExternalLink aria-hidden />
              Open the GitHub repository
            </Command.Item>
          </Command.Group>
        </Command.List>
        <div className="cmdk-foot">
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> select</span>
          <span><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
