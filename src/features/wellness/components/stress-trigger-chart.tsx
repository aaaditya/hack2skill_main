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
import type { StressTriggerCategory } from "@/types";
import { BarChart3 } from "lucide-react";

const TRIGGER_COLORS: Record<StressTriggerCategory, { bg: string; text: string; bar: string }> = {
  academic: { bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-500" },
  social: { bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" },
  financial: { bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500" },
  health: { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
  family: { bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500" },
  other: { bg: "bg-gray-100", text: "text-gray-800", bar: "bg-gray-400" },
};

export function StressTriggerChart() {
  const { state } = useWellnessStore();

  const triggerCounts = useMemo(() => {
    const counts: Partial<Record<StressTriggerCategory, number>> = {};
    const allEntries = [
      ...state.moodEntries,
      ...state.journalEntries,
    ];

    for (const entry of allEntries) {
      for (const trigger of entry.triggers) {
        counts[trigger] = (counts[trigger] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .filter(([, count]) => count > 0) as [StressTriggerCategory, number][];
  }, [state.moodEntries, state.journalEntries]);

  const maxCount = triggerCounts[0]?.[1] ?? 1;

  if (triggerCounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
            Stress Triggers
          </CardTitle>
          <CardDescription>
            Track what&apos;s affecting your mood most frequently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No triggers recorded yet. Select triggers in your mood check-ins.
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
          Stress Triggers
        </CardTitle>
        <CardDescription>
          Most frequent stressors across all your entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol
          className="space-y-3"
          aria-label="Stress trigger frequency chart"
        >
          {triggerCounts.map(([trigger, count]) => {
            const colors = TRIGGER_COLORS[trigger];
            const percentage = Math.round((count / maxCount) * 100);
            return (
              <li key={trigger} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                  >
                    {trigger.charAt(0).toUpperCase() + trigger.slice(1)}
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
                  aria-label={`${trigger}: ${count} occurrences`}
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
