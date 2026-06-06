"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { z } from "zod";
import type {
  MoodEntry,
  JournalEntry,
  ChatMessage,
  WellnessScore,
  ExamContext,
} from "@/types";
import { calculateWellnessScore, generateId } from "@/lib/wellness";

interface WellnessState {
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  chatHistory: ChatMessage[];
  wellnessScore: WellnessScore | null;
  examContext: ExamContext | null;
  isLoaded: boolean;
}

type WellnessAction =
  | { type: "ADD_MOOD_ENTRY"; payload: MoodEntry }
  | { type: "ADD_JOURNAL_ENTRY"; payload: JournalEntry }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_EXAM_CONTEXT"; payload: ExamContext }
  | { type: "CLEAR_EXAM_CONTEXT" }
  | { type: "UPDATE_JOURNAL_INSIGHT"; payload: { id: string; aiInsight: string } }
  | { type: "HYDRATE"; payload: Omit<WellnessState, "isLoaded"> }
  | { type: "CLEAR_CHAT" };

interface WellnessContextValue {
  state: WellnessState;
  addMoodEntry: (entry: Omit<MoodEntry, "id" | "timestamp">) => void;
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => string;
  addChatMessage: (message: Omit<ChatMessage, "timestamp">) => void;
  updateJournalInsight: (id: string, aiInsight: string) => void;
  setExamContext: (ctx: ExamContext) => void;
  clearExamContext: () => void;
  clearChat: () => void;
}

const STORAGE_KEY = "mindfulu_wellness_data";
const PERSIST_DEBOUNCE_MS = 500;

// ─── Zod schema for localStorage shape validation ────────────────────────────
// Lenient — uses .passthrough() so unknown future fields do not break hydration.
const StoredStateSchema = z
  .object({
    moodEntries: z.array(
      z.object({
        id: z.string(),
        timestamp: z.string(),
        moodLevel: z.number().int().min(1).max(5),
        energyLevel: z.number().int().min(1).max(5),
        anxietyLevel: z.number().int().min(1).max(5),
        notes: z.string(),
        triggers: z.array(z.string()),
      }).passthrough()
    ),
    journalEntries: z.array(
      z.object({
        id: z.string(),
        timestamp: z.string(),
        title: z.string(),
        content: z.string(),
        mood: z.number().int().min(1).max(5),
        triggers: z.array(z.string()),
      }).passthrough()
    ),
    chatHistory: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        timestamp: z.string(),
      })
    ),
    wellnessScore: z.object({}).passthrough().nullable().optional(),
    examContext: z.object({}).passthrough().nullable().optional(),
  })
  .passthrough();

const initialState: WellnessState = {
  moodEntries: [],
  journalEntries: [],
  chatHistory: [],
  wellnessScore: null,
  examContext: null,
  isLoaded: false,
};

export function wellnessReducer(
  state: WellnessState,
  action: WellnessAction
): WellnessState {
  switch (action.type) {
    case "ADD_MOOD_ENTRY": {
      const moodEntries = [action.payload, ...state.moodEntries].slice(0, 90);
      const wellnessScore = calculateWellnessScore(moodEntries, state.journalEntries);
      return { ...state, moodEntries, wellnessScore };
    }
    case "ADD_JOURNAL_ENTRY": {
      const journalEntries = [action.payload, ...state.journalEntries].slice(0, 50);
      const wellnessScore = calculateWellnessScore(state.moodEntries, journalEntries);
      return { ...state, journalEntries, wellnessScore };
    }
    case "ADD_CHAT_MESSAGE": {
      const chatHistory = [...state.chatHistory, action.payload].slice(-50);
      return { ...state, chatHistory };
    }
    case "SET_EXAM_CONTEXT":
      return { ...state, examContext: action.payload };
    case "CLEAR_EXAM_CONTEXT":
      return { ...state, examContext: null };
    case "UPDATE_JOURNAL_INSIGHT": {
      const journalEntries = state.journalEntries.map((e) =>
        e.id === action.payload.id
          ? { ...e, aiInsight: action.payload.aiInsight }
          : e
      );
      return { ...state, journalEntries };
    }
    case "HYDRATE":
      return {
        ...action.payload,
        wellnessScore: calculateWellnessScore(
          action.payload.moodEntries,
          action.payload.journalEntries
        ),
        isLoaded: true,
      };
    case "CLEAR_CHAT":
      return { ...state, chatHistory: [] };
    default:
      return state;
  }
}

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wellnessReducer, initialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = StoredStateSchema.safeParse(JSON.parse(stored));
        if (parsed.success) {
          dispatch({
            type: "HYDRATE",
            payload: parsed.data as unknown as Omit<WellnessState, "isLoaded">,
          });
          return;
        }
      }
    } catch {
      // Fall through to set isLoaded with empty state
    }
    dispatch({
      type: "HYDRATE",
      payload: {
        moodEntries: [],
        journalEntries: [],
        chatHistory: [],
        wellnessScore: null,
        examContext: null,
      },
    });
  }, []);

  // Debounced persistence — waits PERSIST_DEBOUNCE_MS after last change
  useEffect(() => {
    if (!state.isLoaded) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            moodEntries: state.moodEntries,
            journalEntries: state.journalEntries,
            chatHistory: state.chatHistory,
            wellnessScore: state.wellnessScore,
            examContext: state.examContext,
          })
        );
      } catch {
        // localStorage unavailable — no-op
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  const addMoodEntry = useCallback(
    (entry: Omit<MoodEntry, "id" | "timestamp">) => {
      dispatch({
        type: "ADD_MOOD_ENTRY",
        payload: { ...entry, id: generateId(), timestamp: new Date().toISOString() },
      });
    },
    []
  );

  const addJournalEntry = useCallback(
    (entry: Omit<JournalEntry, "id" | "timestamp">): string => {
      const id = generateId();
      dispatch({
        type: "ADD_JOURNAL_ENTRY",
        payload: { ...entry, id, timestamp: new Date().toISOString() },
      });
      return id;
    },
    []
  );

  const updateJournalInsight = useCallback(
    (id: string, aiInsight: string) => {
      dispatch({ type: "UPDATE_JOURNAL_INSIGHT", payload: { id, aiInsight } });
    },
    []
  );

  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, "timestamp">) => {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: { ...message, timestamp: new Date().toISOString() },
      });
    },
    []
  );

  const setExamContext = useCallback((ctx: ExamContext) => {
    dispatch({ type: "SET_EXAM_CONTEXT", payload: ctx });
  }, []);

  const clearExamContext = useCallback(() => {
    dispatch({ type: "CLEAR_EXAM_CONTEXT" });
  }, []);

  const clearChat = useCallback(() => dispatch({ type: "CLEAR_CHAT" }), []);

  const value = useMemo(
    () => ({
      state,
      addMoodEntry,
      addJournalEntry,
      updateJournalInsight,
      addChatMessage,
      setExamContext,
      clearExamContext,
      clearChat,
    }),
    [
      state,
      addMoodEntry,
      addJournalEntry,
      updateJournalInsight,
      addChatMessage,
      setExamContext,
      clearExamContext,
      clearChat,
    ]
  );

  return (
    <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>
  );
}

export function useWellnessStore(): WellnessContextValue {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error("useWellnessStore must be used within WellnessProvider");
  return ctx;
}
