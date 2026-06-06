"use client";

import { useMemo } from "react";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateExamReadiness, EXAM_TRIGGER_LABELS } from "@/lib/wellness";
import type { RiskLevel } from "@/types";
import { GraduationCap, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const RISK_STYLES: Record<
  RiskLevel,
  { card: string; badge: string; icon: string }
> = {
  low: {
    card: "border-green-200 bg-green-50/50",
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: "text-green-600",
  },
  moderate: {
    card: "border-yellow-200 bg-yellow-50/50",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "text-yellow-600",
  },
  high: {
    card: "border-orange-200 bg-orange-50/50",
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    icon: "text-orange-600",
  },
  critical: {
    card: "border-red-200 bg-red-50/50",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: "text-red-600",
  },
};

const TREND_ICONS = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
} as const;

const TREND_LABELS = {
  improving: "Improving",
  declining: "Declining",
  stable: "Stable",
} as const;

const TREND_COLORS = {
  improving: "text-green-600",
  declining: "text-red-600",
  stable: "text-yellow-600",
} as const;

const DAYS_URGENCY_MESSAGES: Array<{ maxDays: number; message: string }> = [
  { maxDays: 0, message: "Exam day — stay calm and trust your preparation!" },
  { maxDays: 3, message: "Final days — light revision and rest are key now." },
  { maxDays: 7, message: "One week left — focus on weak areas and sleep well." },
  { maxDays: 14, message: "Two weeks — consistent revision makes the difference." },
  { maxDays: 30, message: "One month — build momentum with daily targets." },
  { maxDays: 60, message: "Two months — balance coverage and practice tests." },
];

function getDaysMessage(days: number): string {
  for (const { maxDays, message } of DAYS_URGENCY_MESSAGES) {
    if (days <= maxDays) return message;
  }
  return "Stay consistent — every day of preparation counts.";
}

export function ExamReadinessCard() {
  const { state } = useWellnessStore();

  const readiness = useMemo(
    () =>
      calculateExamReadiness(
        state.wellnessScore,
        state.moodEntries,
        state.journalEntries,
        state.examContext
      ),
    [
      state.wellnessScore,
      state.moodEntries,
      state.journalEntries,
      state.examContext,
    ]
  );

  const hasData = state.moodEntries.length > 0;
  const styles = RISK_STYLES[readiness.riskLevel];
  const TrendIcon = TREND_ICONS[readiness.wellnessTrend];

  if (!state.examContext) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            Exam Readiness
          </CardTitle>
          <CardDescription>
            Set your exam target to see your readiness status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-3">
            No exam set. Use the &ldquo;Set Your Exam Target&rdquo; card to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = readiness.examDaysRemaining ?? 0;

  return (
    <Card className={styles.card} aria-label="Exam readiness summary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
            Exam Readiness
          </CardTitle>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
            aria-label={`Risk level: ${readiness.riskLabel}`}
          >
            {readiness.riskLevel === "critical" || readiness.riskLevel === "high" ? (
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            ) : null}
            {readiness.riskLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/60 border border-border/50 p-3 space-y-0.5">
            <dt className="text-xs text-muted-foreground font-medium">Exam</dt>
            <dd className="text-lg font-bold text-foreground">
              {readiness.examType}
            </dd>
          </div>

          <div className="rounded-lg bg-white/60 border border-border/50 p-3 space-y-0.5">
            {state.examContext?.phase === "awaiting_results" ? (
              <>
                <dt className="text-xs text-muted-foreground font-medium">Phase</dt>
                <dd className="text-sm font-bold text-rose-600">Awaiting Results</dd>
              </>
            ) : (
              <>
                <dt className="text-xs text-muted-foreground font-medium">
                  Days Until Exam
                </dt>
                <dd
                  className={`text-lg font-bold ${
                    daysRemaining <= 7
                      ? "text-red-600"
                      : daysRemaining <= 30
                      ? "text-orange-600"
                      : "text-foreground"
                  }`}
                  aria-label={`${daysRemaining} days remaining`}
                >
                  {daysRemaining === 0 ? "Today!" : daysRemaining}
                  {daysRemaining > 0 && (
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      days
                    </span>
                  )}
                </dd>
              </>
            )}
          </div>

          <div className="rounded-lg bg-white/60 border border-border/50 p-3 space-y-0.5">
            <dt className="text-xs text-muted-foreground font-medium">
              Wellness Trend
            </dt>
            <dd className="flex items-center gap-1.5">
              <TrendIcon
                className={`h-4 w-4 ${TREND_COLORS[readiness.wellnessTrend]}`}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-semibold ${TREND_COLORS[readiness.wellnessTrend]}`}
              >
                {TREND_LABELS[readiness.wellnessTrend]}
              </span>
            </dd>
          </div>

          <div className="rounded-lg bg-white/60 border border-border/50 p-3 space-y-0.5">
            <dt className="text-xs text-muted-foreground font-medium">
              Top Stressor
            </dt>
            <dd className="text-sm font-semibold text-foreground">
              {readiness.dominantTrigger
                ? EXAM_TRIGGER_LABELS[readiness.dominantTrigger]
                : hasData
                ? "None recorded"
                : "No data yet"}
            </dd>
          </div>
        </dl>

        <div
          className="rounded-md bg-white/70 border border-border/50 px-3 py-2"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            {getDaysMessage(daysRemaining)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
