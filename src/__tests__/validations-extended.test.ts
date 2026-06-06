import {
  TriggerAnalysisRequestSchema,
  ResultsAnxietyRequestSchema,
  JournalInsightRequestSchema,
} from "@/lib/validations";
import { sanitizeString } from "@/lib/gemini";

// ─── TriggerAnalysisRequestSchema ─────────────────────────────────────────────

describe("TriggerAnalysisRequestSchema", () => {
  const validRequest = {
    moodEntries: [],
    journalEntries: [],
    examContext: null,
    triggerSummary: "Mock test performance: 3 occurrences",
  };

  it("accepts a valid request with empty entries", () => {
    expect(TriggerAnalysisRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts request with exam context", () => {
    const result = TriggerAnalysisRequestSchema.safeParse({
      ...validRequest,
      examContext: { examType: "NEET", daysUntilExam: 30, phase: "preparing" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts awaiting_results phase", () => {
    const result = TriggerAnalysisRequestSchema.safeParse({
      ...validRequest,
      examContext: {
        examType: "Class 12 Boards",
        daysUntilExam: 0,
        phase: "awaiting_results",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects trigger summary over 800 characters", () => {
    const result = TriggerAnalysisRequestSchema.safeParse({
      ...validRequest,
      triggerSummary: "a".repeat(801),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 30 mood entries", () => {
    const moodEntries = Array.from({ length: 31 }, () => ({
      moodLevel: 3,
      energyLevel: 3,
      anxietyLevel: 2,
      notes: "",
      triggers: [],
      timestamp: new Date().toISOString(),
    }));
    const result = TriggerAnalysisRequestSchema.safeParse({
      ...validRequest,
      moodEntries,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing triggerSummary field", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { triggerSummary: _unused, ...without } = validRequest;
    expect(TriggerAnalysisRequestSchema.safeParse(without).success).toBe(false);
  });
});

// ─── ResultsAnxietyRequestSchema ──────────────────────────────────────────────

describe("ResultsAnxietyRequestSchema", () => {
  it("accepts empty request body", () => {
    expect(ResultsAnxietyRequestSchema.safeParse({}).success).toBe(true);
  });

  it("accepts full request with all optional fields", () => {
    const result = ResultsAnxietyRequestSchema.safeParse({
      examContext: { examType: "JEE", daysUntilExam: 0, phase: "awaiting_results" },
      recentMoodLevel: 2,
      topTriggers: ["results_anxiety", "peer_comparison"],
      daysUntilExam: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mood level", () => {
    const result = ResultsAnxietyRequestSchema.safeParse({ recentMoodLevel: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid trigger value", () => {
    const result = ResultsAnxietyRequestSchema.safeParse({
      topTriggers: ["not_a_trigger"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 8 top triggers", () => {
    const triggers = Array.from({ length: 9 }, () => "results_anxiety");
    const result = ResultsAnxietyRequestSchema.safeParse({ topTriggers: triggers });
    expect(result.success).toBe(false);
  });

  it("accepts null exam context", () => {
    const result = ResultsAnxietyRequestSchema.safeParse({ examContext: null });
    expect(result.success).toBe(true);
  });

  it("rejects negative days until exam", () => {
    const result = ResultsAnxietyRequestSchema.safeParse({ daysUntilExam: -1 });
    expect(result.success).toBe(false);
  });
});

// ─── JournalInsightRequestSchema ──────────────────────────────────────────────

describe("JournalInsightRequestSchema", () => {
  const validRequest = {
    title: "Tough day with mock test",
    content: "I felt overwhelmed by the results of my mock test today.",
    mood: 2 as const,
    triggers: ["mock_test_performance"] as const,
  };

  it("accepts a valid journal insight request", () => {
    expect(JournalInsightRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("accepts request with exam context", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      examContext: { examType: "NEET", daysUntilExam: 60, phase: "preparing" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects content shorter than 10 characters", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      content: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 100 characters", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      title: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mood level", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      mood: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid trigger value", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      triggers: ["academic"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts null exam context", () => {
    const result = JournalInsightRequestSchema.safeParse({
      ...validRequest,
      examContext: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── sanitizeString direct tests ──────────────────────────────────────────────

describe("sanitizeString", () => {
  it("strips HTML tags but preserves text content", () => {
    expect(sanitizeString("<b>bold</b>")).toBe("bold");
    // Script tags are stripped; the inner text remains (React renders as text node — safe)
    expect(sanitizeString("<script>alert(1)</script>text")).toBe("alert(1)text");
  });

  it("removes angle brackets, quotes, and apostrophes", () => {
    const result = sanitizeString("a > b < c 'quoted' \"double\"");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain("'");
    expect(result).not.toContain('"');
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("caps output at 300 characters", () => {
    const long = "a".repeat(400);
    expect(sanitizeString(long)).toHaveLength(300);
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeString(42)).toBe("");
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
  });

  it("handles empty string", () => {
    expect(sanitizeString("")).toBe("");
  });
});
