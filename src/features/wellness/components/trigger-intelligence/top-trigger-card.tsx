"use client";

import type { TriggerFrequency, TriggerTrend } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXAM_TRIGGER_LABELS, EXAM_TRIGGER_COLORS } from "@/lib/wellness";
import { Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TopTriggerCardProps {
  topTrigger: TriggerFrequency | null;
  trend: TriggerTrend | undefined;
}

const TREND_ICON = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
} as const;

const TREND_COLOR = {
  increasing: "text-red-500",
  decreasing: "text-green-600",
  stable: "text-yellow-600",
} as const;

const TREND_LABEL = {
  increasing: "Rising this week",
  decreasing: "Easing this week",
  stable: "Holding steady",
} as const;

export function TopTriggerCard({ topTrigger, trend }: TopTriggerCardProps) {
  if (!topTrigger) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            Top Trigger
          </CardTitle>
          <CardDescription>Most frequent exam stressor this week</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-3">
            Tag triggers in your check-ins to see patterns here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const colors = EXAM_TRIGGER_COLORS[topTrigger.trigger];
  const trendData = trend;
  const TrendIconComp = trendData ? TREND_ICON[trendData.direction] : null;

  return (
    <Card
      className={`border ${colors.bg} border-current/10`}
      aria-label={`Top trigger: ${EXAM_TRIGGER_LABELS[topTrigger.trigger]}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Top Trigger
        </CardTitle>
        <CardDescription>Most frequent exam stressor this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}
          >
            {EXAM_TRIGGER_LABELS[topTrigger.trigger]}
          </span>
          {TrendIconComp && trendData && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${TREND_COLOR[trendData.direction]}`}
              aria-label={TREND_LABEL[trendData.direction]}
            >
              <TrendIconComp className="h-3.5 w-3.5" aria-hidden="true" />
              {TREND_LABEL[trendData.direction]}
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white/60 border border-border/50 p-2 text-center">
            <dt className="text-xs text-muted-foreground">Total entries</dt>
            <dd className="text-lg font-bold">{topTrigger.totalCount}</dd>
          </div>
          <div className="rounded-md bg-white/60 border border-border/50 p-2 text-center">
            <dt className="text-xs text-muted-foreground">In low-mood entries</dt>
            <dd className="text-lg font-bold text-orange-600">
              {topTrigger.stressfulPercent}%
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
