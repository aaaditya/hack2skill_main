"use client";

import { useMemo } from "react";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import { buildTriggerAnalysis } from "@/lib/trigger-analysis";
import { TopTriggerCard } from "./top-trigger-card";
import { TriggerTrendList } from "./trigger-trend-list";
import { TriggerAiInsight } from "./trigger-ai-insight";
import { RootCauseSummary } from "./root-cause-summary";

export function TriggerIntelligence() {
  const { state } = useWellnessStore();

  const analysis = useMemo(
    () => buildTriggerAnalysis(state.moodEntries, state.journalEntries),
    [state.moodEntries, state.journalEntries]
  );

  const topTriggerTrend = useMemo(
    () =>
      analysis.topTrigger
        ? analysis.trends.find((t) => t.trigger === analysis.topTrigger?.trigger)
        : undefined,
    [analysis.topTrigger, analysis.trends]
  );

  if (!analysis.hasEnoughData && analysis.totalEntries === 0) {
    return null;
  }

  return (
    <section aria-labelledby="trigger-intelligence-heading" className="space-y-4">
      <h2
        id="trigger-intelligence-heading"
        className="text-xl font-semibold"
      >
        Stress Trigger Intelligence
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <TopTriggerCard
          topTrigger={analysis.topTrigger}
          trend={topTriggerTrend}
        />
        <TriggerTrendList
          trends={analysis.trends}
          frequencies={analysis.frequencies}
        />
      </div>

      <TriggerAiInsight
        insightLines={analysis.insightLines}
        totalEntries={analysis.totalEntries}
        stressfulEntries={analysis.stressfulEntries}
      />

      <RootCauseSummary
        analysis={analysis}
        examContext={state.examContext}
      />
    </section>
  );
}
