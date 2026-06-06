import type {
  MoodEntry,
  JournalEntry,
  WellnessScore,
  ExamStressTrigger,
  ExamContext,
  ExamReadiness,
  RiskLevel,
} from "@/types";
import {
  MS_PER_DAY,
  RECENT_DAYS,
  JOURNAL_FREQUENCY_MULTIPLIER,
  ANXIETY_INVERSION_BASE,
  TREND_DELTA_THRESHOLD,
  RISK_THRESHOLD_LOW,
  RISK_THRESHOLD_MODERATE,
  RISK_THRESHOLD_HIGH,
  EXAM_CRITICAL_DAYS,
  EXAM_SOON_DAYS,
  EXAM_URGENCY_ANXIETY_THRESHOLD,
  SCORE_WEIGHT_MOOD,
  SCORE_WEIGHT_ENERGY,
  SCORE_WEIGHT_CALM,
  SCORE_WEIGHT_JOURNAL,
} from "@/lib/constants";

// ─── Internal helpers ─────────────────────────────────────────────────────────

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
  const firstAvg = average(sorted.slice(0, midpoint).map((e) => e.moodLevel));
  const secondAvg = average(sorted.slice(midpoint).map((e) => e.moodLevel));
  const delta = secondAvg - firstAvg;

  if (delta > TREND_DELTA_THRESHOLD) return "improving";
  if (delta < -TREND_DELTA_THRESHOLD) return "declining";
  return "stable";
}

/**
 * Escalates a base risk level based on exam proximity and current anxiety.
 */
function escalateRiskLevel(
  base: RiskLevel,
  days: number | null,
  anxietyAvg: number,
  trend: WellnessScore["trend"]
): RiskLevel {
  if (days === null) return base;

  const isCriticallyClose = days <= EXAM_CRITICAL_DAYS;
  const isExamSoon = days <= EXAM_SOON_DAYS;
  const isHighAnxiety = anxietyAvg >= EXAM_URGENCY_ANXIETY_THRESHOLD;
  const isDeclining = trend === "declining";

  if (isCriticallyClose && isHighAnxiety && base !== "critical") return "critical";
  if (isExamSoon && isDeclining && base === "low") return "moderate";
  if (isExamSoon && isHighAnxiety && base === "low") return "moderate";
  return base;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the composite wellness score (0–100) from recent mood and journal data.
 * Weights: Mood 35%, Energy 25%, Calm (inverted anxiety) 25%, Journal activity 15%.
 * Only considers entries from the last 7 days.
 */
export function calculateWellnessScore(
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[]
): WellnessScore {
  const recentMood = getRecentEntries(moodEntries, RECENT_DAYS);
  const recentJournal = getRecentEntries(journalEntries, RECENT_DAYS);

  const moodAverage = recentMood.length > 0
    ? average(recentMood.map((e) => e.moodLevel))
    : 0;
  const energyAverage = recentMood.length > 0
    ? average(recentMood.map((e) => e.energyLevel))
    : 0;
  const anxietyAverage = recentMood.length > 0
    ? average(recentMood.map((e) => e.anxietyLevel))
    : 0;

  const invertedAnxiety = ANXIETY_INVERSION_BASE - anxietyAverage;
  const journalFrequency = Math.min(
    recentJournal.length * JOURNAL_FREQUENCY_MULTIPLIER,
    100
  );

  const overall =
    recentMood.length === 0
      ? 0
      : Math.round(
          (moodAverage / 5) * SCORE_WEIGHT_MOOD +
            (energyAverage / 5) * SCORE_WEIGHT_ENERGY +
            (invertedAnxiety / 5) * SCORE_WEIGHT_CALM +
            (journalFrequency / 100) * SCORE_WEIGHT_JOURNAL
        );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    moodAverage: Math.round(moodAverage * 10) / 10,
    energyAverage: Math.round(energyAverage * 10) / 10,
    anxietyAverage: Math.round(anxietyAverage * 10) / 10,
    journalFrequency: Math.round(journalFrequency),
    trend: calculateTrend(recentMood),
  };
}

/**
 * Derives exam readiness classification from wellness scores and exam proximity.
 * Escalates risk when exam is critically close (≤3 days) AND anxiety is high,
 * or when exam is soon (≤14 days) AND mood is declining or anxiety is high.
 */
export function calculateExamReadiness(
  wellnessScore: WellnessScore | null,
  moodEntries: MoodEntry[],
  journalEntries: JournalEntry[],
  examContext: ExamContext | null
): ExamReadiness {
  const trend = wellnessScore?.trend ?? "stable";
  const overall = wellnessScore?.overall ?? 0;
  const anxietyAvg = wellnessScore?.anxietyAverage ?? 0;

  const triggerCounts: Partial<Record<ExamStressTrigger, number>> = {};
  for (const entry of [...moodEntries, ...journalEntries]) {
    for (const t of entry.triggers) {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a);
  const dominantTrigger = sorted.length > 0
    ? (sorted[0]?.[0] as ExamStressTrigger)
    : null;

  let baseRisk: RiskLevel;
  if (overall === 0) baseRisk = "low";
  else if (overall >= RISK_THRESHOLD_LOW) baseRisk = "low";
  else if (overall >= RISK_THRESHOLD_MODERATE) baseRisk = "moderate";
  else if (overall >= RISK_THRESHOLD_HIGH) baseRisk = "high";
  else baseRisk = "critical";

  const days = examContext?.daysUntilExam ?? null;
  const riskLevel = escalateRiskLevel(baseRisk, days, anxietyAvg, trend);

  const riskLabels: Record<RiskLevel, string> = {
    low: "On Track",
    moderate: "Needs Attention",
    high: "At Risk",
    critical: "Urgent Support Needed",
  };

  return {
    riskLevel,
    riskLabel: riskLabels[riskLevel],
    dominantTrigger,
    examDaysRemaining: days,
    examType: examContext?.examType ?? null,
    wellnessTrend: trend,
  };
}

export const EXAM_TRIGGER_LABELS: Record<ExamStressTrigger, string> = {
  mock_test_performance: "Mock Test Performance",
  syllabus_backlog: "Syllabus Backlog",
  revision_pressure: "Revision Pressure",
  parent_expectations: "Parent Expectations",
  peer_comparison: "Peer Comparison",
  results_anxiety: "Results Anxiety",
  time_management: "Time Management",
  career_uncertainty: "Career Uncertainty",
};

export const EXAM_TRIGGER_COLORS: Record<
  ExamStressTrigger,
  { bg: string; text: string; bar: string }
> = {
  mock_test_performance: { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
  syllabus_backlog: { bg: "bg-orange-100", text: "text-orange-800", bar: "bg-orange-500" },
  revision_pressure: { bg: "bg-yellow-100", text: "text-yellow-800", bar: "bg-yellow-500" },
  parent_expectations: { bg: "bg-purple-100", text: "text-purple-800", bar: "bg-purple-500" },
  peer_comparison: { bg: "bg-pink-100", text: "text-pink-800", bar: "bg-pink-500" },
  results_anxiety: { bg: "bg-rose-100", text: "text-rose-800", bar: "bg-rose-500" },
  time_management: { bg: "bg-blue-100", text: "text-blue-800", bar: "bg-blue-500" },
  career_uncertainty: { bg: "bg-gray-100", text: "text-gray-700", bar: "bg-gray-400" },
};

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

export function formatDaysUntilExam(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 30) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remaining = days % 7;
  if (remaining === 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  return `${days} days`;
}
