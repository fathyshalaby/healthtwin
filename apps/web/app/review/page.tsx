"use client";
import * as React from "react";
import Link from "next/link";
import { BodyMapReview, Timeline } from "@healthtwin/react";

export default function Review() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>Review</h1>
      <nav><Link href="/">← Capture</Link></nav>
      <BodyMapReview view="anterior" />
      <Timeline />
    </main>
  );
}
