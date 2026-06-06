import {
  analyzeTriggerFrequencies,
  analyzeTriggerTrends,
  generateInsightLines,
  buildTriggerAnalysis,
  shouldActivateResultsAnxietyMode,
  buildTriggerSummaryForAI,
} from "@/lib/trigger-analysis";
import type { MoodEntry, JournalEntry } from "@/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function mood(
  overrides: Partial<MoodEntry> & { daysAgo?: number } = {}
): MoodEntry {
  const { daysAgo = 0, ...rest } = overrides;
  return {
    id: `m-${Math.random()}`,
    timestamp: new Date(Date.now() - daysAgo * MS_PER_DAY).toISOString(),
    moodLevel: 3,
    energyLevel: 3,
    anxietyLevel: 2,
    notes: "",
    triggers: [],
    ...rest,
  };
}

function journal(
  overrides: Partial<JournalEntry> & { daysAgo?: number } = {}
): JournalEntry {
  const { daysAgo = 0, ...rest } = overrides;
  return {
    id: `j-${Math.random()}`,
    timestamp: new Date(Date.now() - daysAgo * MS_PER_DAY).toISOString(),
    title: "Test",
    content: "Test content for the journal entry",
    mood: 3,
    triggers: [],
    ...rest,
  };
}

// ─── analyzeTriggerFrequencies ────────────────────────────────────────────────

describe("analyzeTriggerFrequencies", () => {
  it("returns empty array when no entries exist", () => {
    expect(analyzeTriggerFrequencies([], [])).toEqual([]);
  });

  it("counts triggers across mood and journal entries", () => {
    const moods = [
      mood({ triggers: ["mock_test_performance"] }),
      mood({ triggers: ["mock_test_performance", "revision_pressure"] }),
    ];
    const journals = [
      journal({ triggers: ["revision_pressure"] }),
    ];

    const freqs = analyzeTriggerFrequencies(moods, journals);
    const mock = freqs.find((f) => f.trigger === "mock_test_performance");
    const revision = freqs.find((f) => f.trigger === "revision_pressure");

    expect(mock?.totalCount).toBe(2);
    expect(revision?.totalCount).toBe(2);
  });

  it("sorts by totalCount descending", () => {
    const moods = [
      mood({ triggers: ["syllabus_backlog"] }),
      mood({ triggers: ["syllabus_backlog"] }),
      mood({ triggers: ["results_anxiety"] }),
    ];

    const freqs = analyzeTriggerFrequencies(moods, []);
    expect(freqs[0]?.trigger).toBe("syllabus_backlog");
  });

  it("computes stressfulCount only for low-mood entries", () => {
    const moods = [
      mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
      mood({ moodLevel: 4, triggers: ["mock_test_performance"] }),
    ];

    const freqs = analyzeTriggerFrequencies(moods, []);
    const mock = freqs.find((f) => f.trigger === "mock_test_performance");
    expect(mock?.totalCount).toBe(2);
    expect(mock?.stressfulCount).toBe(1);
  });

  it("calculates stressfulPercent as share of low-mood entries", () => {
    const moods = [
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 4, triggers: ["results_anxiety"] }),
    ];

    const freqs = analyzeTriggerFrequencies(moods, []);
    const ra = freqs.find((f) => f.trigger === "results_anxiety");
    // 2 stressful out of 2 low-mood entries = 100%
    expect(ra?.stressfulPercent).toBe(100);
  });

  it("ignores entries older than the window", () => {
    const oldMood = mood({ daysAgo: 10, triggers: ["peer_comparison"] });
    const freqs = analyzeTriggerFrequencies([oldMood], [], 7);
    expect(freqs).toEqual([]);
  });

  it("counts entries within the window", () => {
    const recent = mood({ daysAgo: 3, triggers: ["time_management"] });
    const freqs = analyzeTriggerFrequencies([recent], [], 7);
    expect(freqs.find((f) => f.trigger === "time_management")?.totalCount).toBe(1);
  });

  it("returns zero stressfulPercent when no low-mood entries exist", () => {
    const moods = [mood({ moodLevel: 4, triggers: ["career_uncertainty"] })];
    const freqs = analyzeTriggerFrequencies(moods, []);
    const cu = freqs.find((f) => f.trigger === "career_uncertainty");
    expect(cu?.stressfulPercent).toBe(0);
  });
});

// ─── analyzeTriggerTrends ─────────────────────────────────────────────────────

describe("analyzeTriggerTrends", () => {
  it("returns empty array when no entries exist", () => {
    expect(analyzeTriggerTrends([], [])).toEqual([]);
  });

  it("marks a trigger as increasing when recentCount > olderCount", () => {
    const moods = [
      mood({ daysAgo: 1, triggers: ["syllabus_backlog"] }),
      mood({ daysAgo: 2, triggers: ["syllabus_backlog"] }),
      mood({ daysAgo: 10, triggers: ["syllabus_backlog"] }), // older window
    ];

    const trends = analyzeTriggerTrends(moods, []);
    const t = trends.find((t) => t.trigger === "syllabus_backlog");
    expect(t?.direction).toBe("increasing");
    expect(t?.recentCount).toBe(2);
    expect(t?.olderCount).toBe(1);
  });

  it("marks a trigger as decreasing when olderCount > recentCount", () => {
    const moods = [
      mood({ daysAgo: 1, triggers: ["parent_expectations"] }),
      mood({ daysAgo: 10, triggers: ["parent_expectations"] }),
      mood({ daysAgo: 11, triggers: ["parent_expectations"] }),
    ];

    const trends = analyzeTriggerTrends(moods, []);
    const t = trends.find((t) => t.trigger === "parent_expectations");
    expect(t?.direction).toBe("decreasing");
  });

  it("marks a trigger as stable when counts are equal", () => {
    const moods = [
      mood({ daysAgo: 1, triggers: ["revision_pressure"] }),
      mood({ daysAgo: 10, triggers: ["revision_pressure"] }),
    ];

    const trends = analyzeTriggerTrends(moods, []);
    const t = trends.find((t) => t.trigger === "revision_pressure");
    expect(t?.direction).toBe("stable");
  });

  it("computes changePercent correctly when olderCount is non-zero", () => {
    const moods = [
      mood({ daysAgo: 1, triggers: ["results_anxiety"] }),
      mood({ daysAgo: 2, triggers: ["results_anxiety"] }),
      mood({ daysAgo: 10, triggers: ["results_anxiety"] }), // 1 older
    ];

    const trends = analyzeTriggerTrends(moods, []);
    const t = trends.find((t) => t.trigger === "results_anxiety");
    // recentCount=2, olderCount=1, change = (2-1)/1 * 100 = 100%
    expect(t?.changePercent).toBe(100);
  });

  it("sets changePercent to 100 when older=0 and recent>0 (new trigger)", () => {
    const moods = [mood({ daysAgo: 1, triggers: ["career_uncertainty"] })];
    const trends = analyzeTriggerTrends(moods, []);
    const t = trends.find((t) => t.trigger === "career_uncertainty");
    expect(t?.changePercent).toBe(100);
  });
});

// ─── generateInsightLines ─────────────────────────────────────────────────────

describe("generateInsightLines", () => {
  it("returns empty array for empty frequencies", () => {
    expect(generateInsightLines([])).toEqual([]);
  });

  it("generates a sentence mentioning the trigger label", () => {
    const freqs = analyzeTriggerFrequencies(
      [
        mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
        mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
        mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
      ],
      []
    );
    const lines = generateInsightLines(freqs);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]?.sentence).toContain("Mock Test Performance");
  });

  it("returns at most 3 insight lines", () => {
    const moods = [
      mood({ triggers: ["mock_test_performance", "syllabus_backlog", "revision_pressure", "results_anxiety"] }),
      mood({ triggers: ["mock_test_performance", "syllabus_backlog"] }),
    ];
    const freqs = analyzeTriggerFrequencies(moods, []);
    const lines = generateInsightLines(freqs);
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  it("mentions stressful percentage when trigger appears in low-mood entries", () => {
    const moods = [
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
    ];
    const freqs = analyzeTriggerFrequencies(moods, []);
    const lines = generateInsightLines(freqs);
    expect(lines[0]?.sentence).toMatch(/\d+%/);
  });
});

// ─── buildTriggerAnalysis ─────────────────────────────────────────────────────

describe("buildTriggerAnalysis", () => {
  it("marks hasEnoughData false for 0 entries", () => {
    const result = buildTriggerAnalysis([], []);
    expect(result.hasEnoughData).toBe(false);
    expect(result.topTrigger).toBeNull();
  });

  it("marks hasEnoughData true for 2+ recent entries", () => {
    const moods = [
      mood({ triggers: ["revision_pressure"] }),
      mood({ triggers: ["revision_pressure"] }),
    ];
    const result = buildTriggerAnalysis(moods, []);
    expect(result.hasEnoughData).toBe(true);
  });

  it("sets topTrigger to most frequent", () => {
    const moods = [
      mood({ triggers: ["peer_comparison"] }),
      mood({ triggers: ["peer_comparison"] }),
      mood({ triggers: ["time_management"] }),
    ];
    const result = buildTriggerAnalysis(moods, []);
    expect(result.topTrigger?.trigger).toBe("peer_comparison");
  });

  it("counts stressful entries correctly", () => {
    const moods = [
      mood({ moodLevel: 1 }),
      mood({ moodLevel: 2 }),
      mood({ moodLevel: 4 }),
    ];
    const result = buildTriggerAnalysis(moods, []);
    expect(result.stressfulEntries).toBe(2);
  });
});

// ─── shouldActivateResultsAnxietyMode ────────────────────────────────────────

describe("shouldActivateResultsAnxietyMode", () => {
  it("returns false when no frequencies exist", () => {
    expect(shouldActivateResultsAnxietyMode([])).toBe(false);
  });

  it("returns false when results_anxiety is not in top 3", () => {
    const freqs = analyzeTriggerFrequencies(
      [
        mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
        mood({ moodLevel: 1, triggers: ["syllabus_backlog"] }),
        mood({ moodLevel: 1, triggers: ["revision_pressure"] }),
        mood({ moodLevel: 4, triggers: ["results_anxiety"] }),
      ],
      []
    );
    // results_anxiety has count 1 (rank 4 out of 4), won't be in top 3
    // but mock/syllabus/revision each have 1 too — could tie; let's check logic
    const result = shouldActivateResultsAnxietyMode(freqs);
    // if results_anxiety has stressfulCount=0, it should be false
    // since it was tagged on moodLevel=4 (not stressful)
    expect(result).toBe(false);
  });

  it("returns true when results_anxiety is top trigger with stressful entries", () => {
    const moods = [
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 1, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 2, triggers: ["results_anxiety"] }),
    ];
    const freqs = analyzeTriggerFrequencies(moods, []);
    expect(shouldActivateResultsAnxietyMode(freqs)).toBe(true);
  });

  it("returns false when results_anxiety appears only in non-stressful entries", () => {
    const moods = [
      mood({ moodLevel: 4, triggers: ["results_anxiety"] }),
      mood({ moodLevel: 5, triggers: ["results_anxiety"] }),
    ];
    const freqs = analyzeTriggerFrequencies(moods, []);
    expect(shouldActivateResultsAnxietyMode(freqs)).toBe(false);
  });
});

// ─── buildTriggerSummaryForAI ─────────────────────────────────────────────────

describe("buildTriggerSummaryForAI", () => {
  it("returns insufficient data message when hasEnoughData is false", () => {
    const analysis = buildTriggerAnalysis([], []);
    const summary = buildTriggerSummaryForAI(analysis);
    expect(summary).toContain("Insufficient data");
  });

  it("includes trigger labels in summary", () => {
    const moods = [
      mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
      mood({ moodLevel: 1, triggers: ["mock_test_performance"] }),
    ];
    const analysis = buildTriggerAnalysis(moods, []);
    const summary = buildTriggerSummaryForAI(analysis);
    expect(summary).toContain("Mock Test Performance");
  });

  it("includes total entry count", () => {
    const moods = [mood(), mood(), mood()];
    const analysis = buildTriggerAnalysis(moods, []);
    const summary = buildTriggerSummaryForAI(analysis);
    expect(summary).toContain("3");
  });

  it("mentions increasing triggers when present", () => {
    const moods = [
      mood({ daysAgo: 1, triggers: ["syllabus_backlog"] }),
      mood({ daysAgo: 2, triggers: ["syllabus_backlog"] }),
      mood({ daysAgo: 10, triggers: ["syllabus_backlog"] }),
    ];
    const analysis = buildTriggerAnalysis(moods, []);
    const summary = buildTriggerSummaryForAI(analysis);
    expect(summary).toMatch(/[Ii]ncreasing/);
  });
});
