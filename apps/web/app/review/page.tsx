"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ReviewPanel, useObservations } from "@healthtwin/react";
import { PageHeader } from "../../src/components/PageHeader";
import { Rise } from "@/components/motion";
import { Button } from "@/components/ui/button";

export default function Review() {
  const { observations } = useObservations();
  return (
    <>
      <PageHeader eyebrow="Review" title="See the pattern" compact>
        A heat map and a timeline — what happened this week versus last month. Hover a region to read its value; tap one to filter the timeline.
      </PageHeader>

      {observations.length === 0 && (
        <Rise className="empty mb-5">
          <span className="empty-icon"><Flame className="size-5" aria-hidden /></span>
          <strong>Nothing to review yet</strong>
          <span>The heat map fills in as you log symptoms.</span>
          <Button asChild size="sm" className="mt-2">
            <Link href="/">Log a symptom <ArrowRight /></Link>
          </Button>
        </Rise>
      )}

      <Rise delay={0.05}>
        <ReviewPanel initialView="anterior" />
      </Rise>
    </>
  );
}
