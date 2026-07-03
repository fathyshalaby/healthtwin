import * as React from "react";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "../src/AppShell";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"], display: "swap" });

export const metadata = {
  title: "HealthTwin",
  description: "Tap where it hurts, log how it feels, and see the pattern.",
};

// Set the theme before first paint so there's no flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('ht-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <AppShell>
          <Providers>{children}</Providers>
        </AppShell>
      </body>
    </html>
  );
}
