"use client";
import * as React from "react";
import { BodyMapCapture } from "@healthtwin/react";
import { EntriesList } from "../src/EntriesList";

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>HealthTwin</h1>
      <BodyMapCapture view="anterior" />
      <EntriesList />
    </main>
  );
}
