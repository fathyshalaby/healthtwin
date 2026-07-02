import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"], display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "HealthTwin — the body-map twin SDK",
  description:
    "An embeddable SDK: users tap where it hurts and log how it feels; you get a structured, longitudinal health record with sync, consent-based sharing, and row-level security built in.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
