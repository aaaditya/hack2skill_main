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
import { getMoodLabel, getAnxietyLabel, formatTimestamp } from "@/lib/wellness";
import type { MoodEntry, StressTriggerCategory } from "@/types";
import { CalendarDays } from "lucide-react";

const TRIGGER_COLORS: Record<StressTriggerCategory, string> = {
  academic: "bg-blue-100 text-blue-800",
  social: "bg-purple-100 text-purple-800",
  financial: "bg-yellow-100 text-yellow-800",
  health: "bg-red-100 text-red-800",
  family: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

function MoodEntryCard({ entry }: { entry: MoodEntry }) {
  return (
    <article
      className="rounded-lg border bg-card p-4 space-y-3"
      aria-label={`Mood check-in from ${formatTimestamp(entry.timestamp)}`}
    >
      <div className="flex items-center justify-between">
        <time
          dateTime={entry.timestamp}
          className="text-xs text-muted-foreground flex items-center gap-1"
        >
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {formatTimestamp(entry.timestamp)}
        </time>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/50 p-2">
          <dt className="text-xs text-muted-foreground">Mood</dt>
          <dd className="text-sm font-semibold">
            {getMoodLabel(entry.moodLevel)}
          </dd>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <dt className="text-xs text-muted-foreground">Energy</dt>
          <dd className="text-sm font-semibold">
            {getMoodLabel(entry.energyLevel)}
          </dd>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <dt className="text-xs text-muted-foreground">Anxiety</dt>
          <dd className="text-sm font-semibold">
            {getAnxietyLabel(entry.anxietyLevel)}
          </dd>
        </div>
      </dl>

      {entry.triggers.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          aria-label="Stress triggers"
        >
          {entry.triggers.map((trigger) => (
            <span
              key={trigger}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TRIGGER_COLORS[trigger]}`}
            >
              {trigger}
            </span>
          ))}
        </div>
      )}

      {entry.notes && (
        <p className="text-sm text-muted-foreground italic">&ldquo;{entry.notes}&rdquo;</p>
      )}
    </article>
  );
}

export function MoodHistory() {
  const { state } = useWellnessStore();
  const entries = useMemo(
    () => state.moodEntries.slice(0, 10),
    [state.moodEntries]
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood History</CardTitle>
          <CardDescription>Your recent check-ins will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No check-ins yet. Complete your first mood check-in above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="mood-history-heading">
      <Card>
        <CardHeader>
          <CardTitle id="mood-history-heading">Recent Check-ins</CardTitle>
          <CardDescription>Your last {entries.length} mood entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3" aria-label="Mood check-in history">
            {entries.map((entry) => (
              <li key={entry.id}>
                <MoodEntryCard entry={entry} />
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
