"use client";

import { useCallback, useState } from "react";
import type { WellnessInsight, ExamContext, TriggerAnalysis } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, RefreshCw } from "lucide-react";
import { AiErrorAlert } from "@/components/shared/ai-error-alert";
import { buildTriggerSummaryForAI } from "@/lib/trigger-analysis";
import { postJson } from "@/lib/api-client";

interface RootCauseSummaryProps {
  analysis: TriggerAnalysis;
  examContext: ExamContext | null;
}

export function RootCauseSummary({
  analysis,
  examContext,
}: RootCauseSummaryProps) {
  const [rootCause, setRootCause] = useState<WellnessInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRootCause = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const triggerSummary = buildTriggerSummaryForAI(analysis);
      const data = await postJson<{ rootCause: WellnessInsight }>("/api/trigger-analysis", {
        moodEntries: [],
        journalEntries: [],
        examContext: examContext ?? null,
        triggerSummary,
      });
      setRootCause(data.rootCause);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate analysis.");
    } finally {
      setIsLoading(false);
    }
  }, [analysis, examContext]);

  if (!analysis.hasEnoughData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4" aria-hidden="true" />
          Root Cause Summary
        </CardTitle>
        <CardDescription>
          AI-generated explanation of what may be driving your stress patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <AiErrorAlert message={error} />}

        {rootCause && !isLoading && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm leading-relaxed text-foreground">
              {rootCause.summary}
            </p>
            {rootCause.positives.length > 0 && (
              <p className="text-sm text-muted-foreground italic">
                {rootCause.positives[0]}
              </p>
            )}
          </div>
        )}

        <Button
          onClick={fetchRootCause}
          disabled={isLoading}
          variant={rootCause ? "outline" : "default"}
          size="sm"
          className="w-full"
          aria-label={
            rootCause ? "Regenerate root cause summary" : "Analyze root cause"
          }
        >
          {isLoading ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span>Analyzing patterns...</span>
            </>
          ) : rootCause ? (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Regenerate</span>
            </>
          ) : (
            "Analyze Root Cause"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
