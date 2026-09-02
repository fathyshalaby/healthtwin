"use client";
import * as React from "react";
import { CaptureBoard } from "../src/CaptureBoard";
import { EntriesList } from "../src/EntriesList";
import { PageHeader } from "../src/components/PageHeader";

export default function Home() {
  return (
    <>
      <PageHeader eyebrow="Capture" title="Tap where it hurts">
        Log how it feels — it autosaves in this browser as a longitudinal record you can review, export, or hand to a clinician.
      </PageHeader>
      <div className="capture-grid">
        <CaptureBoard />
        <EntriesList />
      </div>
    </>
  );
}
