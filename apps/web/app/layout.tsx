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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <AppShell>
          <Providers>{children}</Providers>
        </AppShell>
      </body>
    </html>
  );
}
