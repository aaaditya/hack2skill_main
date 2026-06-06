import type {
  MoodEntry,
  JournalEntry,
  WellnessScore,
  ExamStressTrigger,
  ExamContext,
  ExamReadiness,
  RiskLevel,
} from "@/types";

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
    recentMood.length > 0 ? average(recentMood.map((e) => e.moodLevel)) : 0;

  const energyAverage =
    recentMood.length > 0 ? average(recentMood.map((e) => e.energyLevel)) : 0;

  const anxietyAverage =
    recentMood.length > 0 ? average(recentMood.map((e) => e.anxietyLevel)) : 0;

  const invertedAnxiety = ANXIETY_INVERSION_BASE - anxietyAverage;

  const journalFrequency = Math.min(
    recentJournal.length * JOURNAL_FREQUENCY_MULTIPLIER,
    MAX_JOURNAL_FREQUENCY * 100
  );

  const overall =
    recentMood.length === 0
      ? 0
      : Math.round(
          (moodAverage / 5) * 35 +
            (energyAverage / 5) * 25 +
            (invertedAnxiety / 5) * 25 +
            (journalFrequency / 100) * 15
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

/**
 * Derives exam readiness risk level from wellness score + exam proximity.
 * High anxiety near exam date escalates the risk classification.
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

  // Count dominant trigger across all entries
  const triggerCounts: Partial<Record<ExamStressTrigger, number>> = {};
  for (const entry of [...moodEntries, ...journalEntries]) {
    for (const t of entry.triggers) {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a);
  const dominantTrigger =
    sorted.length > 0 ? (sorted[0]?.[0] as ExamStressTrigger) : null;

  // Base risk from wellness score
  let riskLevel: RiskLevel;
  if (overall === 0) {
    riskLevel = "low"; // no data yet
  } else if (overall >= 70) {
    riskLevel = "low";
  } else if (overall >= 50) {
    riskLevel = "moderate";
  } else if (overall >= 30) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }

  // Escalate based on proximity to exam + high anxiety
  const days = examContext?.daysUntilExam ?? null;
  if (days !== null) {
    const isExamSoon = days <= 14;
    const isCriticallyClose = days <= 3;
    const isHighAnxiety = anxietyAvg >= 3.5;
    const isDeclining = trend === "declining";

    if (isCriticallyClose && isHighAnxiety && riskLevel !== "critical") {
      riskLevel = "critical";
    } else if (isExamSoon && isDeclining && riskLevel === "low") {
      riskLevel = "moderate";
    } else if (isExamSoon && isHighAnxiety && riskLevel === "low") {
      riskLevel = "moderate";
    }
  }

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
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remaining = days % 7;
  if (remaining === 0) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  return `${days} days`;
}
