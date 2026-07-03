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
        <p className="lede">Log how it feels — it becomes a longitudinal record you and your clinician can read.</p>
      </div>
      <CaptureBoard />
      <EntriesList />
    </>
  );
}
