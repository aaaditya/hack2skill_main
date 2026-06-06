export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type ExamType =
  | "NEET"
  | "JEE"
  | "CUET"
  | "CAT"
  | "GATE"
  | "UPSC"
  | "Board Exams"
  | "Other";

export type ExamStressTrigger =
  | "mock_test_performance"
  | "syllabus_backlog"
  | "revision_pressure"
  | "parent_expectations"
  | "peer_comparison"
  | "results_anxiety"
  | "time_management"
  | "career_uncertainty";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface ExamContext {
  examType: ExamType;
  daysUntilExam: number;
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  moodLevel: MoodLevel;
  energyLevel: MoodLevel;
  anxietyLevel: MoodLevel;
  notes: string;
  triggers: ExamStressTrigger[];
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  mood: MoodLevel;
  triggers: ExamStressTrigger[];
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

export interface ExamReadiness {
  riskLevel: RiskLevel;
  riskLabel: string;
  dominantTrigger: ExamStressTrigger | null;
  examDaysRemaining: number | null;
  examType: ExamType | null;
  wellnessTrend: WellnessScore["trend"];
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
  examContext: ExamContext | null;
}
