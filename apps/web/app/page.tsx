"use client";
import * as React from "react";
import { CaptureBoard } from "../src/CaptureBoard";
import { EntriesList } from "../src/EntriesList";

export default function Home() {
  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Capture</span>
        <h1>Tap where it hurts</h1>
        <p className="lede">Log how it feels — it autosaves in this browser as a longitudinal record you can review, export, or hand to a clinician.</p>
      </div>
      <div className="capture-grid">
        <CaptureBoard />
        <EntriesList />
      </div>
    </>
  );
}
