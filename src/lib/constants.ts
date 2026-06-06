/**
 * Shared application constants.
 * Single source of truth for magic numbers and strings used across modules.
 */

// ─── AI / Gemini ──────────────────────────────────────────────────────────────

export const GEMINI_MODEL = "gemini-2.5-flash";

// ─── Time ─────────────────────────────────────────────────────────────────────

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Wellness score formula weights (must sum to 100) ─────────────────────────

export const SCORE_WEIGHT_MOOD = 35;
export const SCORE_WEIGHT_ENERGY = 25;
export const SCORE_WEIGHT_CALM = 25;
export const SCORE_WEIGHT_JOURNAL = 15;

export const ANXIETY_INVERSION_BASE = 6;
export const TREND_DELTA_THRESHOLD = 0.3;

// ─── Wellness score risk thresholds ───────────────────────────────────────────

export const RISK_THRESHOLD_LOW = 70;
export const RISK_THRESHOLD_MODERATE = 50;
export const RISK_THRESHOLD_HIGH = 30;

// ─── Exam readiness proximity thresholds (days) ───────────────────────────────

export const EXAM_CRITICAL_DAYS = 3;
export const EXAM_SOON_DAYS = 14;
export const EXAM_URGENCY_ANXIETY_THRESHOLD = 3.5;

// ─── Storage limits ───────────────────────────────────────────────────────────

export const MAX_MOOD_ENTRIES = 90;
export const MAX_JOURNAL_ENTRIES = 50;
export const MAX_CHAT_MESSAGES = 50;

// ─── UI display limits ────────────────────────────────────────────────────────

export const HISTORY_DISPLAY_LIMIT = 10;
export const MOOD_SUMMARY_COUNT = 7;
export const JOURNAL_SUMMARY_COUNT = 3;
export const MAX_INSIGHT_LINES = 3;
export const TOP_TRIGGER_SUMMARY_COUNT = 5;
export const MAX_VISIBLE_TRENDS = 5;
export const TOP_TRIGGERS_COUNT = 5;
export const MAX_SPECIALIZED_GUIDANCE = 6;

// ─── Timing ───────────────────────────────────────────────────────────────────

export const SUCCESS_DISPLAY_MS = 2000;
export const INPUT_FOCUS_DELAY_MS = 100;
export const PERSIST_DEBOUNCE_MS = 500;

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const MAX_CHAT_REPLY_LENGTH = 1000;

// ─── Exam ─────────────────────────────────────────────────────────────────────

export const DEFAULT_DAYS_UNTIL_EXAM = 90;
export const MAX_DAYS_UNTIL_EXAM = 730;

// ─── Journal insight ─────────────────────────────────────────────────────────

export const JOURNAL_INSIGHT_CONTENT_PREVIEW = 400;
export const JOURNAL_INSIGHT_MAX_WORDS = 60;

// ─── Wellness analysis ────────────────────────────────────────────────────────

export const RECENT_DAYS = 7;
export const COMPARISON_WINDOW_DAYS = 14;
export const MIN_ENTRIES_FOR_ANALYSIS = 2;
export const STRESSFUL_MOOD_THRESHOLD = 2;
export const TREND_CHANGE_THRESHOLD = 0.5;
export const JOURNAL_FREQUENCY_MULTIPLIER = 20;

// ─── Exam types (ordered for display) ────────────────────────────────────────

export const EXAM_TYPES = [
  "NEET",
  "JEE",
  "CUET",
  "CAT",
  "GATE",
  "UPSC",
  "Class 12 Boards",
  "Class 10 Boards",
  "Other",
] as const satisfies readonly string[];

/** Exam names shown as informational badges (excludes "Other") */
export const EXAM_DISPLAY_BADGES = EXAM_TYPES.filter((e) => e !== "Other");
