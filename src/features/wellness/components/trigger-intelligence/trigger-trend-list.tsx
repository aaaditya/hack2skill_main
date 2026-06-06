"use client";

import type { TriggerTrend, TriggerFrequency } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXAM_TRIGGER_LABELS, EXAM_TRIGGER_COLORS } from "@/lib/wellness";
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from "lucide-react";

interface TriggerTrendListProps {
  trends: TriggerTrend[];
  frequencies: TriggerFrequency[];
}

const DIRECTION_CONFIG = {
  increasing: {
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Rising",
    ariaLabel: "increasing",
  },
  decreasing: {
    icon: TrendingDown,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Easing",
    ariaLabel: "decreasing",
  },
  stable: {
    icon: Minus,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    label: "Stable",
    ariaLabel: "stable",
  },
} as const;

export function TriggerTrendList({ trends, frequencies }: TriggerTrendListProps) {
  // Only show triggers that have appeared at least once; sort by recent count desc
  const visible = trends
    .filter((t) => t.recentCount > 0 || t.olderCount > 0)
    .sort((a, b) => b.recentCount - a.recentCount)
    .slice(0, 5);

  if (visible.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            Trigger Trends
          </CardTitle>
          <CardDescription>Week-over-week stressor movement</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-3">
            Log triggers over multiple days to see trend direction.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          Trigger Trends
        </CardTitle>
        <CardDescription>
          Comparing this week vs the previous week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol
          className="space-y-2"
          aria-label="Trigger trend list"
        >
          {visible.map((trend) => {
            const config = DIRECTION_CONFIG[trend.direction];
            const DirectionIcon = config.icon;
            const colors = EXAM_TRIGGER_COLORS[trend.trigger];
            const freq = frequencies.find((f) => f.trigger === trend.trigger);

            return (
              <li
                key={trend.trigger}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                aria-label={`${EXAM_TRIGGER_LABELS[trend.trigger]}: ${config.ariaLabel}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${colors.bg} ${colors.text}`}
                  >
                    {EXAM_TRIGGER_LABELS[trend.trigger]}
                  </span>
                  {freq && freq.stressfulCount > 0 && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {freq.stressfulCount} in low-mood entries
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {trend.olderCount}→{trend.recentCount}
                  </span>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-semibold ${config.color}`}
                  >
                    <DirectionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {config.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
