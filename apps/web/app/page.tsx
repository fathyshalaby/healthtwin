"use client";
import * as React from "react";
import Link from "next/link";
import { BodyMapCapture } from "@healthtwin/react";
import { EntriesList } from "../src/EntriesList";

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>HealthTwin</h1>
      <nav><Link href="/review">Review →</Link></nav>
      <BodyMapCapture view="anterior" />
      <EntriesList />
    </main>
  );
}
