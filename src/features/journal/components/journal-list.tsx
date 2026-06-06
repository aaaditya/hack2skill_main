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
import { formatTimestamp, getMoodLabel } from "@/lib/wellness";
import type { JournalEntry } from "@/types";
import { BookOpen, CalendarDays } from "lucide-react";

function JournalCard({ entry }: { entry: JournalEntry }) {
  return (
    <article
      className="rounded-lg border bg-card p-4 space-y-2"
      aria-label={`Journal entry: ${entry.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight">{entry.title}</h3>
        <time
          dateTime={entry.timestamp}
          className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0"
        >
          <CalendarDays className="h-3 w-3" aria-hidden="true" />
          {formatTimestamp(entry.timestamp)}
        </time>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary"
          aria-label={`Mood: ${getMoodLabel(entry.mood)}`}
        >
          {getMoodLabel(entry.mood)}
        </span>
        {entry.triggers.length > 0 &&
          entry.triggers.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground"
            >
              {t}
            </span>
          ))}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">
        {entry.content}
      </p>

      {entry.aiInsight && (
        <div
          className="rounded-md bg-primary/5 border border-primary/20 p-3 mt-2"
          aria-label="AI insight for this entry"
        >
          <p className="text-xs font-semibold text-primary mb-1">
            AI Insight
          </p>
          <p className="text-xs text-foreground">{entry.aiInsight}</p>
        </div>
      )}
    </article>
  );
}

export function JournalList() {
  const { state } = useWellnessStore();
  const entries = useMemo(
    () => state.journalEntries.slice(0, 10),
    [state.journalEntries]
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            Journal History
          </CardTitle>
          <CardDescription>Your reflections will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No journal entries yet. Write your first reflection above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="journal-history-heading">
      <Card>
        <CardHeader>
          <CardTitle
            id="journal-history-heading"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            Recent Entries
          </CardTitle>
          <CardDescription>
            Your last {entries.length} journal entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3" aria-label="Journal entry history">
            {entries.map((entry) => (
              <li key={entry.id}>
                <JournalCard entry={entry} />
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
