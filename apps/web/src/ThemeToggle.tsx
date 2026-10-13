"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Theme = "light" | "dark";

export function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("ht-theme", next);
  } catch {
    /* private mode */
  }
}

export function currentTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const current = currentTheme();
    setTheme(current);
    document.documentElement.classList.toggle("dark", current === "dark");
    // The palette can flip the theme too — stay in sync with it.
    const onChange = () => setTheme(currentTheme());
    window.addEventListener("ht:theme", onChange);
    return () => window.removeEventListener("ht:theme", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="theme-toggle size-[34px] rounded-full bg-card shadow-xs"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title="Toggle theme"
    >
      <span key={theme} className="swap grid place-items-center">
        {theme === "dark" ? <Sun /> : <Moon />}
      </span>
    </Button>
  );
}
