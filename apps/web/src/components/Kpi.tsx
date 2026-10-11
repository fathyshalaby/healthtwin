"use client";
import * as React from "react";
import { CountUp, Rise } from "@/components/motion";

/** A dashboard stat tile: mono label, big tabular number, optional sub-line and tone. */
export function Kpi({
  label,
  value,
  decimals = 0,
  sub,
  tone,
  animate = true,
  delay = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
  sub?: React.ReactNode;
  tone?: "heat" | "mint" | "amber";
  /** Turn off the count-up where the number must be correct without scrolling (e.g. the printable report). */
  animate?: boolean;
  delay?: number;
}) {
  return (
    <Rise delay={delay} className="kpi" data-tone={tone}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-val">
        {animate ? <CountUp value={value} decimals={decimals} /> : value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </span>
      {sub ? <span className="kpi-sub">{sub}</span> : null}
    </Rise>
  );
}
