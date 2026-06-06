import {
  buildWellnessPrompt,
  buildChatPrompt,
  buildJournalInsightPrompt,
} from "@/lib/gemini";
import type { ExamContext } from "@/types";

// ─── buildWellnessPrompt ──────────────────────────────────────────────────────

describe("buildWellnessPrompt", () => {
  const moodSummary = "3 entries: avg mood 3, anxiety 2";
  const journalSummary = "Entry: Tough revision day";

  it("includes mood and journal summaries in output", () => {
    const prompt = buildWellnessPrompt(moodSummary, journalSummary);
    expect(prompt).toContain(moodSummary);
    expect(prompt).toContain(journalSummary);
  });

  it("includes exam type when context provided", () => {
    const ctx: ExamContext = { examType: "NEET", daysUntilExam: 30, phase: "preparing" };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).toContain("NEET");
    expect(prompt).toContain("30");
  });

  it("flags critical proximity when exam is within 7 days", () => {
    const ctx: ExamContext = { examType: "JEE", daysUntilExam: 5, phase: "preparing" };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).toMatch(/CRITICAL|within one week/i);
  });

  it("does NOT flag critical for exams > 7 days away", () => {
    const ctx: ExamContext = { examType: "CAT", daysUntilExam: 60, phase: "preparing" };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).not.toMatch(/CRITICAL: Exam is within/);
  });

  it("switches to awaiting-results mode and blocks revision advice", () => {
    const ctx: ExamContext = {
      examType: "NEET",
      daysUntilExam: 0,
      phase: "awaiting_results",
    };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).toMatch(/Awaiting results/i);
    expect(prompt).toMatch(/Do NOT give revision or study advice/i);
  });

  it("does not include days-remaining line when phase is awaiting_results", () => {
    const ctx: ExamContext = {
      examType: "JEE",
      daysUntilExam: 0,
      phase: "awaiting_results",
    };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).not.toContain("Days until exam: 0");
  });

  it("includes board-specific guidance for Class 12 Boards", () => {
    const ctx: ExamContext = {
      examType: "Class 12 Boards",
      daysUntilExam: 45,
      phase: "preparing",
    };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).toMatch(/practical|stream|ISA|finality/i);
  });

  it("includes board-specific guidance for Class 10 Boards", () => {
    const ctx: ExamContext = {
      examType: "Class 10 Boards",
      daysUntilExam: 60,
      phase: "preparing",
    };
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, ctx);
    expect(prompt).toMatch(/milestone|stream/i);
  });

  it("uses generic guidance when no exam context provided", () => {
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, null);
    expect(prompt).toContain("Not specified");
  });

  it("returns a string containing a JSON template", () => {
    const prompt = buildWellnessPrompt(moodSummary, journalSummary);
    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"suggestions"');
    expect(prompt).toContain('"triggers"');
    expect(prompt).toContain('"positives"');
  });
});

// ─── buildChatPrompt ──────────────────────────────────────────────────────────

describe("buildChatPrompt", () => {
  it("includes user message in prompt", () => {
    const prompt = buildChatPrompt("I feel anxious", "No context");
    expect(prompt).toContain("I feel anxious");
  });

  it("includes context string in prompt", () => {
    const ctx = "Preparing for NEET, 30 days remaining";
    const prompt = buildChatPrompt("Help me", ctx);
    expect(prompt).toContain(ctx);
  });

  it("instructs to focus on uncertainty management for awaiting phase", () => {
    const prompt = buildChatPrompt("I'm worried", "Awaiting results for: JEE");
    expect(prompt).toMatch(/awaiting|uncertainty|result/i);
  });

  it("enforces response length limit in instructions", () => {
    const prompt = buildChatPrompt("Hello", "No context");
    expect(prompt).toContain("150 words");
  });
});

// ─── buildJournalInsightPrompt ────────────────────────────────────────────────

describe("buildJournalInsightPrompt", () => {
  it("includes journal title and truncated content", () => {
    const prompt = buildJournalInsightPrompt(
      "Tough day",
      "Today was a difficult day of revision."
    );
    expect(prompt).toContain("Tough day");
    expect(prompt).toContain("Today was a difficult day of revision.");
  });

  it("includes exam type when context provided", () => {
    const ctx: ExamContext = { examType: "GATE", daysUntilExam: 20, phase: "preparing" };
    const prompt = buildJournalInsightPrompt("Entry", "Some content here.", ctx);
    expect(prompt).toContain("GATE");
  });

  it("mentions awaiting when phase is awaiting_results", () => {
    const ctx: ExamContext = {
      examType: "CAT",
      daysUntilExam: 0,
      phase: "awaiting_results",
    };
    const prompt = buildJournalInsightPrompt("Waiting", "I am anxious.", ctx);
    expect(prompt).toMatch(/awaiting/i);
  });

  it("caps content at 400 characters in prompt", () => {
    const longContent = "a".repeat(500);
    const prompt = buildJournalInsightPrompt("Title", longContent);
    const contentInPrompt = prompt.match(/"([a{500}]+)"/)?.[0] ?? "";
    expect(contentInPrompt.length).toBeLessThanOrEqual(405);
  });

  it("instructs single sentence output with character limit", () => {
    const prompt = buildJournalInsightPrompt("Title", "Some journal content here.");
    expect(prompt).toContain("60 words");
  });
});
