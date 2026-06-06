"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
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
  | { type: "UPDATE_WELLNESS_SCORE"; payload: WellnessScore }
  | { type: "SET_EXAM_CONTEXT"; payload: ExamContext }
  | { type: "CLEAR_EXAM_CONTEXT" }
  | { type: "HYDRATE"; payload: Omit<WellnessState, "isLoaded"> }
  | { type: "CLEAR_CHAT" };

interface WellnessContextValue {
  state: WellnessState;
  addMoodEntry: (entry: Omit<MoodEntry, "id" | "timestamp">) => void;
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => void;
  addChatMessage: (message: Omit<ChatMessage, "timestamp">) => void;
  setExamContext: (ctx: ExamContext) => void;
  clearExamContext: () => void;
  clearChat: () => void;
}

const STORAGE_KEY = "mindfulu_wellness_data";

const initialState: WellnessState = {
  moodEntries: [],
  journalEntries: [],
  chatHistory: [],
  wellnessScore: null,
  examContext: null,
  isLoaded: false,
};

function wellnessReducer(
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
    case "UPDATE_WELLNESS_SCORE":
      return { ...state, wellnessScore: action.payload };
    case "SET_EXAM_CONTEXT":
      return { ...state, examContext: action.payload };
    case "CLEAR_EXAM_CONTEXT":
      return { ...state, examContext: null };
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isValidStoredState(parsed)) {
          dispatch({ type: "HYDRATE", payload: parsed });
          return;
        }
      }
    } catch {
      // Fall through to set isLoaded
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

  useEffect(() => {
    if (!state.isLoaded) return;
    try {
      const toStore = {
        moodEntries: state.moodEntries,
        journalEntries: state.journalEntries,
        chatHistory: state.chatHistory,
        wellnessScore: state.wellnessScore,
        examContext: state.examContext,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // localStorage unavailable — no-op
    }
  }, [state]);

  const addMoodEntry = useCallback(
    (entry: Omit<MoodEntry, "id" | "timestamp">) => {
      dispatch({
        type: "ADD_MOOD_ENTRY",
        payload: {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        },
      });
    },
    []
  );

  const addJournalEntry = useCallback(
    (entry: Omit<JournalEntry, "id" | "timestamp">) => {
      dispatch({
        type: "ADD_JOURNAL_ENTRY",
        payload: {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        },
      });
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
      addChatMessage,
      setExamContext,
      clearExamContext,
      clearChat,
    }),
    [
      state,
      addMoodEntry,
      addJournalEntry,
      addChatMessage,
      setExamContext,
      clearExamContext,
      clearChat,
    ]
  );

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellnessStore(): WellnessContextValue {
  const ctx = useContext(WellnessContext);
  if (!ctx) {
    throw new Error("useWellnessStore must be used within WellnessProvider");
  }
  return ctx;
}

function isValidStoredState(
  value: unknown
): value is Omit<WellnessState, "isLoaded"> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj["moodEntries"]) &&
    Array.isArray(obj["journalEntries"]) &&
    Array.isArray(obj["chatHistory"])
  );
}
