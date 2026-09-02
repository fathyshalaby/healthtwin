"use client";
import * as React from "react";
import { ReviewPanel } from "@healthtwin/react";
import { PageHeader } from "../../src/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function Review() {
  return (
    <>
      <PageHeader eyebrow="Review" title="See the pattern">
        A heat map and a timeline — what happened this week versus last month.
      </PageHeader>
      <Card className="plate">
        <CardContent className="pt-4">
          <ReviewPanel initialView="anterior" />
        </CardContent>
      </Card>
    </>
  );
}
