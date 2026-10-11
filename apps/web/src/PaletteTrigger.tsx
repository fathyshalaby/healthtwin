"use client";
import * as React from "react";
import { Search } from "lucide-react";

/** The topbar trigger. Shows the platform-appropriate shortcut after mount (avoids an SSR mismatch). */
export function PaletteTrigger({ onClick }: { onClick: () => void }) {
  const [mac, setMac] = React.useState(false);
  React.useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);
  return (
    <button type="button" className="kbd-hint" onClick={onClick} aria-label="Open command palette">
      <Search className="size-4 lg:size-3.5" aria-hidden />
      <span className="kbd-label">
        <span>Search</span>
        <span className="kbd" aria-hidden>{mac ? "⌘" : "Ctrl"} K</span>
      </span>
    </button>
  );
}
