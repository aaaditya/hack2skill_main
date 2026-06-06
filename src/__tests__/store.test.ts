import { wellnessReducer } from "@/features/wellness/hooks/use-wellness-store";
import type { MoodEntry, JournalEntry, ChatMessage, ExamContext } from "@/types";

function makeMoodEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: `m-${Math.random()}`,
    timestamp: new Date().toISOString(),
    moodLevel: 3,
    energyLevel: 3,
    anxietyLevel: 2,
    notes: "",
    triggers: [],
    ...overrides,
  };
}

function makeJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: `j-${Math.random()}`,
    timestamp: new Date().toISOString(),
    title: "Test",
    content: "Test content",
    mood: 3,
    triggers: [],
    ...overrides,
  };
}

const baseState = {
  moodEntries: [],
  journalEntries: [],
  chatHistory: [],
  wellnessScore: null,
  examContext: null,
  isLoaded: false,
};

describe("wellnessReducer — ADD_MOOD_ENTRY", () => {
  it("prepends new entry to moodEntries", () => {
    const entry = makeMoodEntry({ id: "new" });
    const next = wellnessReducer(baseState, { type: "ADD_MOOD_ENTRY", payload: entry });
    expect(next.moodEntries[0]?.id).toBe("new");
  });

  it("caps moodEntries at 90", () => {
    const full = {
      ...baseState,
      moodEntries: Array.from({ length: 90 }, (_, i) => makeMoodEntry({ id: `e${i}` })),
    };
    const next = wellnessReducer(full, {
      type: "ADD_MOOD_ENTRY",
      payload: makeMoodEntry({ id: "new" }),
    });
    expect(next.moodEntries).toHaveLength(90);
    expect(next.moodEntries[0]?.id).toBe("new");
  });

  it("recalculates wellnessScore after adding entry", () => {
    const entry = makeMoodEntry({ moodLevel: 5, energyLevel: 5, anxietyLevel: 1 });
    const next = wellnessReducer(baseState, { type: "ADD_MOOD_ENTRY", payload: entry });
    expect(next.wellnessScore).not.toBeNull();
    expect(next.wellnessScore?.overall).toBeGreaterThan(0);
  });
});

describe("wellnessReducer — ADD_JOURNAL_ENTRY", () => {
  it("prepends new journal entry", () => {
    const entry = makeJournalEntry({ id: "j-new" });
    const next = wellnessReducer(baseState, {
      type: "ADD_JOURNAL_ENTRY",
      payload: entry,
    });
    expect(next.journalEntries[0]?.id).toBe("j-new");
  });

  it("caps journalEntries at 50", () => {
    const full = {
      ...baseState,
      journalEntries: Array.from({ length: 50 }, (_, i) =>
        makeJournalEntry({ id: `j${i}` })
      ),
    };
    const next = wellnessReducer(full, {
      type: "ADD_JOURNAL_ENTRY",
      payload: makeJournalEntry({ id: "j-new" }),
    });
    expect(next.journalEntries).toHaveLength(50);
  });
});

describe("wellnessReducer — ADD_CHAT_MESSAGE", () => {
  it("appends messages to chatHistory", () => {
    const msg: ChatMessage = { role: "user", content: "Hello", timestamp: new Date().toISOString() };
    const next = wellnessReducer(baseState, { type: "ADD_CHAT_MESSAGE", payload: msg });
    expect(next.chatHistory).toHaveLength(1);
    expect(next.chatHistory[0]?.role).toBe("user");
  });

  it("caps chatHistory at 50 messages", () => {
    const full = {
      ...baseState,
      chatHistory: Array.from<unknown, ChatMessage>({ length: 50 }, (_, i) => ({
        role: "user",
        content: `msg ${i}`,
        timestamp: new Date().toISOString(),
      })),
    };
    const next = wellnessReducer(full, {
      type: "ADD_CHAT_MESSAGE",
      payload: { role: "assistant", content: "Reply", timestamp: new Date().toISOString() },
    });
    expect(next.chatHistory).toHaveLength(50);
    expect(next.chatHistory[49]?.role).toBe("assistant");
  });
});

describe("wellnessReducer — SET_EXAM_CONTEXT / CLEAR_EXAM_CONTEXT", () => {
  const ctx: ExamContext = { examType: "NEET", daysUntilExam: 60, phase: "preparing" };

  it("sets exam context", () => {
    const next = wellnessReducer(baseState, { type: "SET_EXAM_CONTEXT", payload: ctx });
    expect(next.examContext).toEqual(ctx);
  });

  it("clears exam context", () => {
    const state = { ...baseState, examContext: ctx };
    const next = wellnessReducer(state, { type: "CLEAR_EXAM_CONTEXT" });
    expect(next.examContext).toBeNull();
  });

  it("stores awaiting_results phase", () => {
    const awaitingCtx: ExamContext = { examType: "JEE", daysUntilExam: 0, phase: "awaiting_results" };
    const next = wellnessReducer(baseState, { type: "SET_EXAM_CONTEXT", payload: awaitingCtx });
    expect(next.examContext?.phase).toBe("awaiting_results");
  });
});

describe("wellnessReducer — UPDATE_JOURNAL_INSIGHT", () => {
  it("updates aiInsight on matching entry", () => {
    const entry = makeJournalEntry({ id: "j1" });
    const state = { ...baseState, journalEntries: [entry] };
    const next = wellnessReducer(state, {
      type: "UPDATE_JOURNAL_INSIGHT",
      payload: { id: "j1", aiInsight: "You showed real resilience today." },
    });
    expect(next.journalEntries[0]?.aiInsight).toBe("You showed real resilience today.");
  });

  it("does not modify other entries", () => {
    const e1 = makeJournalEntry({ id: "j1" });
    const e2 = makeJournalEntry({ id: "j2" });
    const state = { ...baseState, journalEntries: [e1, e2] };
    const next = wellnessReducer(state, {
      type: "UPDATE_JOURNAL_INSIGHT",
      payload: { id: "j1", aiInsight: "Great reflection." },
    });
    expect(next.journalEntries[1]?.aiInsight).toBeUndefined();
  });

  it("is a no-op for unknown entry id", () => {
    const entry = makeJournalEntry({ id: "j1" });
    const state = { ...baseState, journalEntries: [entry] };
    const next = wellnessReducer(state, {
      type: "UPDATE_JOURNAL_INSIGHT",
      payload: { id: "unknown", aiInsight: "text" },
    });
    expect(next.journalEntries[0]?.aiInsight).toBeUndefined();
  });
});

describe("wellnessReducer — CLEAR_CHAT", () => {
  it("empties chat history", () => {
    const state = {
      ...baseState,
      chatHistory: [
        { role: "user" as const, content: "Hi", timestamp: new Date().toISOString() },
      ],
    };
    const next = wellnessReducer(state, { type: "CLEAR_CHAT" });
    expect(next.chatHistory).toHaveLength(0);
  });
});

describe("wellnessReducer — HYDRATE", () => {
  it("sets isLoaded to true and recalculates wellness score", () => {
    const moodEntry = makeMoodEntry({ moodLevel: 4, energyLevel: 4, anxietyLevel: 2 });
    const next = wellnessReducer(
      { ...baseState, isLoaded: false },
      {
        type: "HYDRATE",
        payload: {
          moodEntries: [moodEntry],
          journalEntries: [],
          chatHistory: [],
          wellnessScore: null,
          examContext: null,
        },
      }
    );
    expect(next.isLoaded).toBe(true);
    expect(next.wellnessScore?.overall).toBeGreaterThan(0);
  });

  it("restores exam context from payload", () => {
    const ctx: ExamContext = { examType: "UPSC", daysUntilExam: 180, phase: "preparing" };
    const next = wellnessReducer(baseState, {
      type: "HYDRATE",
      payload: {
        moodEntries: [],
        journalEntries: [],
        chatHistory: [],
        wellnessScore: null,
        examContext: ctx,
      },
    });
    expect(next.examContext?.examType).toBe("UPSC");
  });
});
