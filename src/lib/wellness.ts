import type { MoodEntry, JournalEntry, WellnessScore } from "@/types";

const RECENT_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ANXIETY_INVERSION_BASE = 6;
const JOURNAL_FREQUENCY_MULTIPLIER = 20;
const MAX_JOURNAL_FREQUENCY = 1;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getRecentEntries<T extends { timestamp: string }>(
  entries: T[],
  days: number
): T[] {
  const cutoff = Date.now() - days * MS_PER_DAY;
  return entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

function calculateTrend(
  entries: Array<{ timestamp: string; moodLevel: number }>
): WellnessScore["trend"] {
  if (entries.length < 2) return "stable";

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  const firstAvg = average(firstHalf.map((e) => e.moodLevel));
  const secondAvg = average(secondHalf.map((e) => e.moodLevel));
  const delta = secondAvg - firstAvg;

  if (delta > 0.3) return "improving";
  if (delta < -0.3) return "declining";
  return "stable";
}

export function calculateWellnessScore(
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[]
): WellnessScore {
  const recentMood = getRecentEntries(moodEntries, RECENT_DAYS);
  const recentJournal = getRecentEntries(journalEntries, RECENT_DAYS);

  const moodAverage =
    recentMood.length > 0
      ? average(recentMood.map((e) => e.moodLevel))
      : 0;

  const energyAverage =
    recentMood.length > 0
      ? average(recentMood.map((e) => e.energyLevel))
      : 0;

  const anxietyAverage =
    recentMood.length > 0
      ? average(recentMood.map((e) => e.anxietyLevel))
      : 0;

  const invertedAnxiety = ANXIETY_INVERSION_BASE - anxietyAverage;

  const journalFrequency = Math.min(
    recentJournal.length * JOURNAL_FREQUENCY_MULTIPLIER,
    MAX_JOURNAL_FREQUENCY * 100
  );

  const overall =
    recentMood.length === 0
      ? 0
      : Math.round(
          ((moodAverage / 5) * 35 +
            (energyAverage / 5) * 25 +
            (invertedAnxiety / 5) * 25 +
            (journalFrequency / 100) * 15)
        );

  const trend = calculateTrend(recentMood);

  return {
    overall: Math.min(100, Math.max(0, overall)),
    moodAverage: Math.round(moodAverage * 10) / 10,
    energyAverage: Math.round(energyAverage * 10) / 10,
    anxietyAverage: Math.round(anxietyAverage * 10) / 10,
    journalFrequency: Math.round(journalFrequency),
    trend,
  };
}

export function getMoodLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "Very Low",
    2: "Low",
    3: "Moderate",
    4: "Good",
    5: "Excellent",
  };
  return labels[level] ?? "Unknown";
}

export function getAnxietyLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "Minimal",
    2: "Mild",
    3: "Moderate",
    4: "High",
    5: "Severe",
  };
  return labels[level] ?? "Unknown";
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
