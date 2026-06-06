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
import {
  EXAM_TRIGGER_LABELS,
  EXAM_TRIGGER_COLORS,
} from "@/lib/wellness";
import type { ExamStressTrigger } from "@/types";
import { BarChart3 } from "lucide-react";

export function StressTriggerChart() {
  const { state } = useWellnessStore();

  const triggerCounts = useMemo(() => {
    const counts: Partial<Record<ExamStressTrigger, number>> = {};
    const allEntries = [...state.moodEntries, ...state.journalEntries];

    for (const entry of allEntries) {
      for (const trigger of entry.triggers) {
        counts[trigger as ExamStressTrigger] =
          (counts[trigger as ExamStressTrigger] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .filter(([, count]) => count > 0) as [ExamStressTrigger, number][];
  }, [state.moodEntries, state.journalEntries]);

  const maxCount = triggerCounts[0]?.[1] ?? 1;

  if (triggerCounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Exam Stress Triggers
          </CardTitle>
          <CardDescription>
            Track which exam pressures affect you most frequently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No triggers recorded yet. Tag triggers in your mood check-ins and
            journal entries to see patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Exam Stress Triggers
        </CardTitle>
        <CardDescription>
          Most frequent exam pressures across all your entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3" aria-label="Exam stress trigger frequency chart">
          {triggerCounts.map(([trigger, count]) => {
            const colors = EXAM_TRIGGER_COLORS[trigger];
            const percentage = Math.round((count / maxCount) * 100);
            return (
              <li key={trigger} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                  >
                    {EXAM_TRIGGER_LABELS[trigger]}
                  </span>
                  <span
                    className="text-xs text-muted-foreground"
                    aria-label={`${count} occurrences`}
                  >
                    {count}×
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-label={`${EXAM_TRIGGER_LABELS[trigger]}: ${count} occurrences`}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
