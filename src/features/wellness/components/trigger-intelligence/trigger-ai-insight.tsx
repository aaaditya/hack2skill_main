"use client";

import type { TriggerInsightLine } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface TriggerAiInsightProps {
  insightLines: TriggerInsightLine[];
  totalEntries: number;
  stressfulEntries: number;
}

export function TriggerAiInsight({
  insightLines,
  totalEntries,
  stressfulEntries,
}: TriggerAiInsightProps) {
  if (insightLines.length === 0) {
    return null;
  }

  const stressPercent =
    totalEntries > 0 ? Math.round((stressfulEntries / totalEntries) * 100) : 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Trigger Insights
        </CardTitle>
        <CardDescription>
          Pattern observations from your last 7 days ({totalEntries}{" "}
          {totalEntries === 1 ? "entry" : "entries"},{" "}
          {stressPercent}% low-mood)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul
          className="space-y-2"
          aria-label="Trigger insight observations"
        >
          {insightLines.map(({ trigger, sentence }) => (
            <li
              key={trigger}
              className="flex items-start gap-2 text-sm"
              aria-label={sentence}
            >
              <span
                className="shrink-0 text-primary mt-0.5 font-bold"
                aria-hidden="true"
              >
                →
              </span>
              <span>{sentence}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
