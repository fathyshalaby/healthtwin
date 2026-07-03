import * as React from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = { title: "HealthTwin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
