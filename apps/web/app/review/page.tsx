"use client";
import * as React from "react";
import Link from "next/link";
import { ReviewPanel } from "@healthtwin/react";

export default function Review() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>Review</h1>
      <nav><Link href="/">← Capture</Link></nav>
      <ReviewPanel initialView="anterior" />
    </main>
  );
}
