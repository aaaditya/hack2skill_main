"use client";

import { useCallback, useState } from "react";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { AiErrorAlert } from "@/components/shared/ai-error-alert";
import type { WellnessInsight } from "@/types";

export function WellnessInsightPanel() {
  const { state } = useWellnessStore();
  const [insight, setInsight] = useState<WellnessInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodEntries: state.moodEntries.slice(0, 7),
          journalEntries: state.journalEntries.slice(0, 3),
          examContext: state.examContext ?? null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ?? "Failed to load insight"
        );
      }

      const data = (await response.json()) as { insight: WellnessInsight };
      setInsight(data.insight);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load wellness insight."
      );
    } finally {
      setIsLoading(false);
    }
  }, [state.moodEntries, state.journalEntries, state.examContext]);

  const hasData = state.moodEntries.length > 0;
  const examLabel = state.examContext?.examType
    ? `your ${state.examContext.examType} preparation`
    : "your exam preparation";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
          AI Exam Wellness Insight
        </CardTitle>
        <CardDescription>
          Personalized analysis of how exam pressure is affecting your wellbeing
          and study performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Add mood check-ins to unlock AI-powered insights about{" "}
            {examLabel}.
          </p>
        )}

        {error && <AiErrorAlert message={error} />}

        {insight && !isLoading && (
          <div className="space-y-4" aria-live="polite">
            <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm leading-relaxed">{insight.summary}</p>
            </div>

            {insight.suggestions.length > 0 && (
              <section aria-labelledby="suggestions-heading">
                <h3
                  id="suggestions-heading"
                  className="text-sm font-semibold mb-2 text-green-700"
                >
                  Study Wellness Tips
                </h3>
                <ul className="space-y-1.5">
                  {insight.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className="shrink-0 text-green-600 mt-0.5"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {insight.triggers.length > 0 && (
              <section aria-labelledby="triggers-heading">
                <h3
                  id="triggers-heading"
                  className="text-sm font-semibold mb-2 text-orange-700"
                >
                  Exam Stressors Identified
                </h3>
                <ul className="space-y-1.5">
                  {insight.triggers.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className="shrink-0 text-orange-500 mt-0.5"
                        aria-hidden="true"
                      >
                        ⚠
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {insight.positives.length > 0 && (
              <section aria-labelledby="positives-heading">
                <h3
                  id="positives-heading"
                  className="text-sm font-semibold mb-2 text-blue-700"
                >
                  Preparation Strengths
                </h3>
                <ul className="space-y-1.5">
                  {insight.positives.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className="shrink-0 text-blue-500 mt-0.5"
                        aria-hidden="true"
                      >
                        ★
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <Button
          onClick={fetchInsight}
          disabled={isLoading || !hasData}
          className="w-full"
          aria-label={
            insight
              ? "Refresh exam wellness insight"
              : "Generate exam wellness insight"
          }
        >
          {isLoading ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span>Analyzing exam preparation data...</span>
            </>
          ) : insight ? (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Refresh Insight</span>
            </>
          ) : (
            "Generate Exam Wellness Insight"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
