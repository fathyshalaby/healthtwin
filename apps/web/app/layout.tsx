import * as React from "react";
import { Bricolage_Grotesque, Geist, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "../src/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"], display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"], display: "swap" });

export const metadata = {
  title: "HealthTwin",
  description: "Tap where it hurts, log how it feels, and see the pattern.",
};

// Set the theme before first paint so there's no flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('ht-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, display.variable, mono.variable, "font-sans")}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <TooltipProvider>
          <AppShell>
            <Providers>
              {children}
            </Providers>
          </AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
