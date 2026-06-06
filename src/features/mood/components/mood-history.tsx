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
  getMoodLabel,
  getAnxietyLabel,
  formatTimestamp,
  EXAM_TRIGGER_LABELS,
  EXAM_TRIGGER_COLORS,
} from "@/lib/wellness";
import type { MoodEntry, ExamStressTrigger } from "@/types";
import { CalendarDays } from "lucide-react";

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
        <div className="flex flex-wrap gap-1" aria-label="Exam stress triggers">
          {entry.triggers.map((trigger) => {
            const colors = EXAM_TRIGGER_COLORS[trigger as ExamStressTrigger];
            return (
              <span
                key={trigger}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {EXAM_TRIGGER_LABELS[trigger as ExamStressTrigger]}
              </span>
            );
          })}
        </div>
      )}

      {entry.notes && (
        <p className="text-sm text-muted-foreground italic">
          &ldquo;{entry.notes}&rdquo;
        </p>
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
          <CardTitle>Check-in History</CardTitle>
          <CardDescription>Your recent mood entries will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No check-ins yet. Record your first mood check-in above!
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
