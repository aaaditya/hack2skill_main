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
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

const TREND_ICONS = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
} as const;

const TREND_COLORS = {
  improving: "text-green-600",
  declining: "text-red-600",
  stable: "text-yellow-600",
} as const;

const TREND_BADGE_VARIANTS = {
  improving: "bg-green-100 text-green-800",
  declining: "bg-red-100 text-red-800",
  stable: "bg-yellow-100 text-yellow-800",
} as const;

function ScoreBar({
  label,
  value,
  max,
  description,
}: {
  label: string;
  value: number;
  max: number;
  description: string;
}) {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {value.toFixed(1)}/{max}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        aria-label={`${label}: ${value.toFixed(1)} out of ${max}. ${description}`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function WellnessScoreCard() {
  const { state } = useWellnessStore();
  const score = state.wellnessScore;

  const hasData = useMemo(
    () => state.moodEntries.length > 0,
    [state.moodEntries.length]
  );

  if (!hasData || !score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            Wellness Score
          </CardTitle>
          <CardDescription>
            Complete at least one mood check-in to see your score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No data yet. Start tracking your mood to see insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = TREND_ICONS[score.trend];
  const invertedAnxiety = (6 - score.anxietyAverage).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            Wellness Score
          </CardTitle>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TREND_BADGE_VARIANTS[score.trend]}`}
            aria-label={`Trend: ${score.trend}`}
          >
            <TrendIcon
              className={`h-3 w-3 ${TREND_COLORS[score.trend]}`}
              aria-hidden="true"
            />
            {score.trend.charAt(0).toUpperCase() + score.trend.slice(1)}
          </span>
        </div>
        <CardDescription>Based on your last 7 days of check-ins</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center" aria-live="polite">
          <div
            className="text-6xl font-bold text-primary"
            aria-label={`Overall wellness score: ${score.overall} out of 100`}
          >
            {score.overall}
          </div>
          <p className="text-sm text-muted-foreground mt-1">out of 100</p>
        </div>

        <div className="space-y-4">
          <ScoreBar
            label="Mood"
            value={score.moodAverage}
            max={5}
            description="Average daily mood level"
          />
          <ScoreBar
            label="Energy"
            value={score.energyAverage}
            max={5}
            description="Average energy level"
          />
          <ScoreBar
            label="Calm"
            value={parseFloat(invertedAnxiety)}
            max={5}
            description="Inverse of anxiety (higher = calmer)"
          />
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Journal Activity</span>
              <span className="text-sm text-muted-foreground">
                {state.journalEntries.length} entries
              </span>
            </div>
            <Progress
              value={Math.min(score.journalFrequency, 100)}
              className="h-2"
              aria-label={`Journal activity: ${score.journalFrequency}%`}
            />
            <p className="text-xs text-muted-foreground">
              Regular journaling improves self-awareness
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
