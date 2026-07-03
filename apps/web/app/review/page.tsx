"use client";
import * as React from "react";
import { ReviewPanel } from "@healthtwin/react";

export default function Review() {
  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Review</span>
        <h1>See the pattern</h1>
        <p className="lede">A heat map and a timeline — what happened this week versus last month.</p>
      </div>
      <div className="plate">
        <ReviewPanel initialView="anterior" />
      </div>
    </>
  );
}
