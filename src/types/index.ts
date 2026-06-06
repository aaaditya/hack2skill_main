export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type StressTriggerCategory =
  | "academic"
  | "social"
  | "financial"
  | "health"
  | "family"
  | "other";

export interface MoodEntry {
  id: string;
  timestamp: string;
  moodLevel: MoodLevel;
  energyLevel: MoodLevel;
  anxietyLevel: MoodLevel;
  notes: string;
  triggers: StressTriggerCategory[];
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  mood: MoodLevel;
  triggers: StressTriggerCategory[];
  aiInsight?: string;
}

export interface WellnessScore {
  overall: number;
  moodAverage: number;
  energyAverage: number;
  anxietyAverage: number;
  journalFrequency: number;
  trend: "improving" | "stable" | "declining";
}

export interface WellnessInsight {
  summary: string;
  suggestions: string[];
  triggers: string[];
  positives: string[];
}

export interface AIWellnessResponse {
  insight: WellnessInsight;
  score: number;
  urgencyLevel: "low" | "medium" | "high";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface WellnessSession {
  moodEntries: MoodEntry[];
  journalEntries: JournalEntry[];
  chatHistory: ChatMessage[];
}
