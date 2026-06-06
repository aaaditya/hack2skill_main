import type {
  MoodEntry,
  JournalEntry,
  ExamStressTrigger,
  TriggerFrequency,
  TriggerTrend,
  TriggerTrendDirection,
  TriggerInsightLine,
  TriggerAnalysis,
} from "@/types";
import { EXAM_TRIGGER_LABELS } from "@/lib/wellness";
import {
  MS_PER_DAY,
  RECENT_DAYS as RECENT_WINDOW_DAYS,
  COMPARISON_WINDOW_DAYS,
  MIN_ENTRIES_FOR_ANALYSIS,
  TREND_CHANGE_THRESHOLD,
  STRESSFUL_MOOD_THRESHOLD,
  MAX_INSIGHT_LINES,
  TOP_TRIGGER_SUMMARY_COUNT,
} from "@/lib/constants";

// ─── Entry helpers ────────────────────────────────────────────────────────────

type AnyEntry = (MoodEntry | JournalEntry) & { timestamp: string };

function entryMood(entry: MoodEntry | JournalEntry): number {
  return "moodLevel" in entry ? entry.moodLevel : entry.mood;
}

function isStressful(entry: MoodEntry | JournalEntry): boolean {
  return entryMood(entry) <= STRESSFUL_MOOD_THRESHOLD;
}

function withinDays(entry: { timestamp: string }, days: number): boolean {
  const cutoff = Date.now() - days * MS_PER_DAY;
  return new Date(entry.timestamp).getTime() >= cutoff;
}

// ─── Core analysis functions ──────────────────────────────────────────────────

/**
 * Computes frequency stats for every trigger that appears at least once.
 * Entries are the combined mood + journal list for the configured window.
 */
export function analyzeTriggerFrequencies(
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[],
  windowDays: number = RECENT_WINDOW_DAYS
): TriggerFrequency[] {
  const recent: AnyEntry[] = [
    ...moodEntries.filter((e) => withinDays(e, windowDays)),
    ...journalEntries.filter((e) => withinDays(e, windowDays)),
  ];

  const total = recent.length;
  if (total === 0) return [];

  const totalCounts: Partial<Record<ExamStressTrigger, number>> = {};
  const stressfulCounts: Partial<Record<ExamStressTrigger, number>> = {};

  for (const entry of recent) {
    const stressed = isStressful(entry);
    for (const t of entry.triggers) {
      totalCounts[t] = (totalCounts[t] ?? 0) + 1;
      if (stressed) stressfulCounts[t] = (stressfulCounts[t] ?? 0) + 1;
    }
  }

  const stressfulTotal = recent.filter(isStressful).length;

  return (Object.keys(totalCounts) as ExamStressTrigger[])
    .map((trigger) => {
      const totalCount = totalCounts[trigger] ?? 0;
      const stressfulCount = stressfulCounts[trigger] ?? 0;
      return {
        trigger,
        totalCount,
        stressfulCount,
        stressfulPercent:
          stressfulTotal > 0
            ? Math.round((stressfulCount / stressfulTotal) * 100)
            : 0,
        totalPercent: Math.round((totalCount / total) * 100),
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Compares trigger counts in the recent 7-day window vs the prior 7-day window
 * to derive whether each trigger is increasing, decreasing, or stable.
 */
export function analyzeTriggerTrends(
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[]
): TriggerTrend[] {
  const allEntries: AnyEntry[] = [...moodEntries, ...journalEntries];

  const recent = allEntries.filter(
    (e) =>
      withinDays(e, RECENT_WINDOW_DAYS)
  );
  const older = allEntries.filter(
    (e) =>
      withinDays(e, COMPARISON_WINDOW_DAYS) && !withinDays(e, RECENT_WINDOW_DAYS)
  );

  const allTriggers = new Set<ExamStressTrigger>();
  for (const e of allEntries) {
    for (const t of e.triggers) allTriggers.add(t);
  }

  const recentCounts: Partial<Record<ExamStressTrigger, number>> = {};
  for (const e of recent) {
    for (const t of e.triggers) recentCounts[t] = (recentCounts[t] ?? 0) + 1;
  }

  const olderCounts: Partial<Record<ExamStressTrigger, number>> = {};
  for (const e of older) {
    for (const t of e.triggers) olderCounts[t] = (olderCounts[t] ?? 0) + 1;
  }

  return Array.from(allTriggers).map((trigger) => {
    const recentCount = recentCounts[trigger] ?? 0;
    const olderCount = olderCounts[trigger] ?? 0;
    const delta = recentCount - olderCount;

    let direction: TriggerTrendDirection = "stable";
    if (Math.abs(delta) >= TREND_CHANGE_THRESHOLD) {
      direction = delta > 0 ? "increasing" : "decreasing";
    }

    const changePercent =
      olderCount === 0
        ? recentCount > 0 ? 100 : 0
        : Math.round(((recentCount - olderCount) / olderCount) * 100);

    return { trigger, direction, recentCount, olderCount, changePercent };
  });
}

/**
 * Generates one human-readable insight sentence per trigger, e.g.:
 * "Mock Test Performance appeared in 60% of your low-mood entries this week."
 */
export function generateInsightLines(
  frequencies: TriggerFrequency[]
): TriggerInsightLine[] {
  return frequencies
    .filter((f) => f.totalCount > 0)
    .slice(0, MAX_INSIGHT_LINES)
    .map((f) => {
      const label = EXAM_TRIGGER_LABELS[f.trigger];
      let sentence: string;

      if (f.stressfulCount > 0 && f.stressfulPercent >= 50) {
        sentence = `${label} appeared in ${f.stressfulPercent}% of your low-mood entries this week.`;
      } else if (f.stressfulCount > 0) {
        sentence = `${label} was present in ${f.stressfulCount} stressful ${f.stressfulCount === 1 ? "entry" : "entries"} — worth watching.`;
      } else {
        sentence = `${label} appeared ${f.totalCount}× this week, though mood stayed stable when it did.`;
      }

      return { trigger: f.trigger, sentence };
    });
}

/**
 * Master function that runs the full analysis pipeline.
 */
export function buildTriggerAnalysis(
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[]
): TriggerAnalysis {
  const allRecent = [
    ...moodEntries.filter((e) => withinDays(e, RECENT_WINDOW_DAYS)),
    ...journalEntries.filter((e) => withinDays(e, RECENT_WINDOW_DAYS)),
  ];

  const hasEnoughData = allRecent.length >= MIN_ENTRIES_FOR_ANALYSIS;

  const frequencies = analyzeTriggerFrequencies(moodEntries, journalEntries);
  const trends = analyzeTriggerTrends(moodEntries, journalEntries);
  const insightLines = generateInsightLines(frequencies);
  const stressfulEntries = allRecent.filter(isStressful).length;

  return {
    topTrigger: frequencies[0] ?? null,
    frequencies,
    trends,
    insightLines,
    totalEntries: allRecent.length,
    stressfulEntries,
    hasEnoughData,
  };
}

/**
 * Returns true when results_anxiety is a top-3 trigger AND appears in
 * at least one stressful entry — activating Results Anxiety Mode.
 */
export function shouldActivateResultsAnxietyMode(
  frequencies: TriggerFrequency[]
): boolean {
  const top3 = frequencies.slice(0, 3);
  const resultsEntry = top3.find((f) => f.trigger === "results_anxiety");
  return resultsEntry !== undefined && resultsEntry.stressfulCount > 0;
}

/**
 * Builds a concise data summary string for the root-cause AI prompt.
 */
export function buildTriggerSummaryForAI(analysis: TriggerAnalysis): string {
  if (!analysis.hasEnoughData) {
    return "Insufficient data for analysis.";
  }

  const lines: string[] = [
    `Total recent entries: ${analysis.totalEntries}`,
    `Low-mood entries: ${analysis.stressfulEntries}`,
  ];

  for (const f of analysis.frequencies.slice(0, TOP_TRIGGER_SUMMARY_COUNT)) {
    lines.push(
      `${EXAM_TRIGGER_LABELS[f.trigger]}: ${f.totalCount} occurrences, ` +
        `${f.stressfulCount} in low-mood entries (${f.stressfulPercent}%)`
    );
  }

  const increasing = analysis.trends
    .filter((t) => t.direction === "increasing")
    .map((t) => EXAM_TRIGGER_LABELS[t.trigger]);

  if (increasing.length > 0) {
    lines.push(`Increasing triggers: ${increasing.join(", ")}`);
  }

  return lines.join("\n");
}
