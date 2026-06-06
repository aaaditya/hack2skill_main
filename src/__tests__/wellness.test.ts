import { calculateWellnessScore, getMoodLabel, getAnxietyLabel, calculateExamReadiness } from "@/lib/wellness";
import type { MoodEntry, JournalEntry, ExamContext } from "@/types";

function makeMoodEntry(
  overrides: Partial<MoodEntry> & { daysAgo?: number } = {}
): MoodEntry {
  const { daysAgo = 0, ...rest } = overrides;
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `mood-${Math.random()}`,
    timestamp: ts,
    moodLevel: 3,
    energyLevel: 3,
    anxietyLevel: 2,
    notes: "",
    triggers: [],
    ...rest,
  };
}

function makeJournalEntry(
  overrides: Partial<JournalEntry> & { daysAgo?: number } = {}
): JournalEntry {
  const { daysAgo = 0, ...rest } = overrides;
  const ts = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `journal-${Math.random()}`,
    timestamp: ts,
    title: "Test",
    content: "Test content",
    mood: 3,
    triggers: [],
    ...rest,
  };
}

describe("calculateWellnessScore", () => {
  it("returns zero overall score when no entries exist", () => {
    const score = calculateWellnessScore([], []);
    expect(score.overall).toBe(0);
    expect(score.moodAverage).toBe(0);
    expect(score.energyAverage).toBe(0);
    expect(score.anxietyAverage).toBe(0);
    expect(score.trend).toBe("stable");
  });

  it("calculates correct overall score for excellent mood data", () => {
    const entries = [1, 2, 3].map(() =>
      makeMoodEntry({ moodLevel: 5, energyLevel: 5, anxietyLevel: 1 })
    );
    const score = calculateWellnessScore(entries, []);
    expect(score.overall).toBeGreaterThanOrEqual(80);
    expect(score.moodAverage).toBe(5);
    expect(score.energyAverage).toBe(5);
    expect(score.anxietyAverage).toBe(1);
  });

  it("calculates lower score for poor mood data", () => {
    const entries = [1, 2, 3].map(() =>
      makeMoodEntry({ moodLevel: 1, energyLevel: 1, anxietyLevel: 5 })
    );
    const score = calculateWellnessScore(entries, []);
    expect(score.overall).toBeLessThan(30);
  });

  it("ignores entries older than 7 days", () => {
    const oldEntry = makeMoodEntry({
      moodLevel: 5,
      energyLevel: 5,
      anxietyLevel: 1,
      daysAgo: 8,
    });
    const score = calculateWellnessScore([oldEntry], []);
    expect(score.overall).toBe(0);
  });

  it("includes journal activity in score calculation", () => {
    const moodEntries = [
      makeMoodEntry({ moodLevel: 3, energyLevel: 3, anxietyLevel: 3 }),
    ];
    const scoreWithoutJournal = calculateWellnessScore(moodEntries, []);
    const journalEntries = [1, 2, 3, 4, 5].map(() => makeJournalEntry());
    const scoreWithJournal = calculateWellnessScore(moodEntries, journalEntries);
    expect(scoreWithJournal.overall).toBeGreaterThan(scoreWithoutJournal.overall);
  });

  it("detects improving trend", () => {
    const entries = [
      makeMoodEntry({ moodLevel: 1, daysAgo: 6 }),
      makeMoodEntry({ moodLevel: 2, daysAgo: 5 }),
      makeMoodEntry({ moodLevel: 3, daysAgo: 4 }),
      makeMoodEntry({ moodLevel: 4, daysAgo: 3 }),
      makeMoodEntry({ moodLevel: 5, daysAgo: 2 }),
      makeMoodEntry({ moodLevel: 5, daysAgo: 1 }),
    ];
    const score = calculateWellnessScore(entries, []);
    expect(score.trend).toBe("improving");
  });

  it("detects declining trend", () => {
    const entries = [
      makeMoodEntry({ moodLevel: 5, daysAgo: 6 }),
      makeMoodEntry({ moodLevel: 4, daysAgo: 5 }),
      makeMoodEntry({ moodLevel: 3, daysAgo: 4 }),
      makeMoodEntry({ moodLevel: 2, daysAgo: 3 }),
      makeMoodEntry({ moodLevel: 1, daysAgo: 2 }),
      makeMoodEntry({ moodLevel: 1, daysAgo: 1 }),
    ];
    const score = calculateWellnessScore(entries, []);
    expect(score.trend).toBe("declining");
  });

  it("returns stable trend for flat mood", () => {
    const entries = [1, 2, 3, 4, 5, 6].map((daysAgo) =>
      makeMoodEntry({ moodLevel: 3, daysAgo })
    );
    const score = calculateWellnessScore(entries, []);
    expect(score.trend).toBe("stable");
  });

  it("caps overall score at 100", () => {
    const entries = [1, 2, 3, 4, 5].map(() =>
      makeMoodEntry({ moodLevel: 5, energyLevel: 5, anxietyLevel: 1 })
    );
    const journals = [1, 2, 3, 4, 5].map(() => makeJournalEntry());
    const score = calculateWellnessScore(entries, journals);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("overall score is always non-negative", () => {
    const entries = [
      makeMoodEntry({ moodLevel: 1, energyLevel: 1, anxietyLevel: 5 }),
    ];
    const score = calculateWellnessScore(entries, []);
    expect(score.overall).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateExamReadiness", () => {
  it("returns low risk with no data", () => {
    const readiness = calculateExamReadiness(null, [], [], null);
    expect(readiness.riskLevel).toBe("low");
    expect(readiness.dominantTrigger).toBeNull();
    expect(readiness.examType).toBeNull();
  });

  it("returns low risk for high wellness score", () => {
    const wellnessScore = {
      overall: 80,
      moodAverage: 4,
      energyAverage: 4,
      anxietyAverage: 2,
      journalFrequency: 60,
      trend: "stable" as const,
    };
    const readiness = calculateExamReadiness(wellnessScore, [], [], null);
    expect(readiness.riskLevel).toBe("low");
  });

  it("returns critical risk for very low wellness score", () => {
    const wellnessScore = {
      overall: 25,
      moodAverage: 1.5,
      energyAverage: 1.5,
      anxietyAverage: 4.5,
      journalFrequency: 0,
      trend: "declining" as const,
    };
    const readiness = calculateExamReadiness(wellnessScore, [], [], null);
    expect(readiness.riskLevel).toBe("critical");
  });

  it("returns high risk for low-moderate wellness score", () => {
    const wellnessScore = {
      overall: 38,
      moodAverage: 2,
      energyAverage: 2.5,
      anxietyAverage: 3.5,
      journalFrequency: 0,
      trend: "stable" as const,
    };
    const readiness = calculateExamReadiness(wellnessScore, [], [], null);
    expect(readiness.riskLevel).toBe("high");
  });

  it("escalates risk to critical when exam is very close and anxiety is high", () => {
    const wellnessScore = {
      overall: 55,
      moodAverage: 3,
      energyAverage: 3,
      anxietyAverage: 4,
      journalFrequency: 20,
      trend: "stable" as const,
    };
    const examContext: ExamContext = { examType: "NEET", daysUntilExam: 2, phase: "preparing" };
    const readiness = calculateExamReadiness(
      wellnessScore,
      [],
      [],
      examContext
    );
    expect(readiness.riskLevel).toBe("critical");
  });

  it("identifies dominant trigger from mood entries", () => {
    const moodEntries = [
      makeMoodEntry({ triggers: ["mock_test_performance", "revision_pressure"] }),
      makeMoodEntry({ triggers: ["mock_test_performance"] }),
      makeMoodEntry({ triggers: ["syllabus_backlog"] }),
    ];
    const wellnessScore = calculateWellnessScore(moodEntries, []);
    const readiness = calculateExamReadiness(
      wellnessScore,
      moodEntries,
      [],
      null
    );
    expect(readiness.dominantTrigger).toBe("mock_test_performance");
  });

  it("includes exam context in readiness result", () => {
    const examContext: ExamContext = { examType: "JEE", daysUntilExam: 45, phase: "preparing" };
    const readiness = calculateExamReadiness(null, [], [], examContext);
    expect(readiness.examType).toBe("JEE");
    expect(readiness.examDaysRemaining).toBe(45);
  });
});

describe("getMoodLabel", () => {
  it("returns correct labels", () => {
    expect(getMoodLabel(1)).toBe("Very Low");
    expect(getMoodLabel(2)).toBe("Low");
    expect(getMoodLabel(3)).toBe("Moderate");
    expect(getMoodLabel(4)).toBe("Good");
    expect(getMoodLabel(5)).toBe("Excellent");
  });

  it("returns Unknown for out-of-range values", () => {
    expect(getMoodLabel(0)).toBe("Unknown");
    expect(getMoodLabel(6)).toBe("Unknown");
  });
});

describe("getAnxietyLabel", () => {
  it("returns correct labels", () => {
    expect(getAnxietyLabel(1)).toBe("Minimal");
    expect(getAnxietyLabel(5)).toBe("Severe");
  });
});
