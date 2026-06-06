import { z } from "zod";

export const MoodLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const ExamTypeSchema = z.enum([
  "NEET",
  "JEE",
  "CUET",
  "CAT",
  "GATE",
  "UPSC",
  "Class 12 Boards",
  "Class 10 Boards",
  "Other",
]);

export const ExamPhaseSchema = z.enum(["preparing", "awaiting_results"]);

export const ExamStressTriggerSchema = z.enum([
  "mock_test_performance",
  "syllabus_backlog",
  "revision_pressure",
  "parent_expectations",
  "peer_comparison",
  "results_anxiety",
  "time_management",
  "career_uncertainty",
]);

export const ExamContextSchema = z.object({
  examType: ExamTypeSchema,
  daysUntilExam: z
    .number()
    .int("Must be a whole number")
    .min(0, "Days cannot be negative")
    .max(730, "Must be within 2 years"),
  phase: ExamPhaseSchema,
});

const MAX_NOTES_LENGTH = 500;
const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const MAX_MESSAGE_LENGTH = 1000;

export const MoodEntrySchema = z.object({
  moodLevel: MoodLevelSchema,
  energyLevel: MoodLevelSchema,
  anxietyLevel: MoodLevelSchema,
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be under ${MAX_NOTES_LENGTH} characters`)
    .transform((val) => val.trim()),
  triggers: z
    .array(ExamStressTriggerSchema)
    .max(8, "Select at most 8 triggers"),
});

export const JournalEntrySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(MAX_TITLE_LENGTH, `Title must be under ${MAX_TITLE_LENGTH} characters`)
    .transform((val) => val.trim()),
  content: z
    .string()
    .min(10, "Journal entry must be at least 10 characters")
    .max(
      MAX_CONTENT_LENGTH,
      `Content must be under ${MAX_CONTENT_LENGTH} characters`
    )
    .transform((val) => val.trim()),
  mood: MoodLevelSchema,
  triggers: z
    .array(ExamStressTriggerSchema)
    .max(8, "Select at most 8 triggers"),
});

export const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(
      MAX_MESSAGE_LENGTH,
      `Message must be under ${MAX_MESSAGE_LENGTH} characters`
    )
    .transform((val) => val.trim())
    .refine(
      (val) => !/\b(ignore previous|system prompt|jailbreak|bypass)\b/i.test(val),
      "Invalid message content"
    ),
  context: z
    .object({
      recentMoodLevel: MoodLevelSchema.optional(),
      recentTriggers: z.array(ExamStressTriggerSchema).optional(),
      examType: ExamTypeSchema.optional(),
      daysUntilExam: z.number().int().min(0).max(730).optional(),
      phase: ExamPhaseSchema.optional(),
    })
    .optional(),
});

export const WellnessInsightRequestSchema = z.object({
  moodEntries: z
    .array(
      z.object({
        moodLevel: MoodLevelSchema,
        energyLevel: MoodLevelSchema,
        anxietyLevel: MoodLevelSchema,
        notes: z.string().max(MAX_NOTES_LENGTH),
        triggers: z.array(ExamStressTriggerSchema),
        timestamp: z.string(),
      })
    )
    .max(30),
  journalEntries: z
    .array(
      z.object({
        title: z.string().max(MAX_TITLE_LENGTH),
        content: z.string().max(MAX_CONTENT_LENGTH),
        mood: MoodLevelSchema,
        triggers: z.array(ExamStressTriggerSchema),
        timestamp: z.string(),
      })
    )
    .max(10),
  examContext: ExamContextSchema.nullable().optional(),
});

export type MoodEntryInput = z.infer<typeof MoodEntrySchema>;
export type JournalEntryInput = z.infer<typeof JournalEntrySchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type WellnessInsightRequest = z.infer<typeof WellnessInsightRequestSchema>;
export type ExamContextInput = z.infer<typeof ExamContextSchema>;

// ─── Trigger Analysis & Results Anxiety ──────────────────────────────────────

const MoodEntrySnapshotSchema = z.object({
  moodLevel: MoodLevelSchema,
  energyLevel: MoodLevelSchema,
  anxietyLevel: MoodLevelSchema,
  notes: z.string().max(MAX_NOTES_LENGTH),
  triggers: z.array(ExamStressTriggerSchema),
  timestamp: z.string(),
});

const JournalEntrySnapshotSchema = z.object({
  title: z.string().max(MAX_TITLE_LENGTH),
  content: z.string().max(MAX_CONTENT_LENGTH),
  mood: MoodLevelSchema,
  triggers: z.array(ExamStressTriggerSchema),
  timestamp: z.string(),
});

export const TriggerAnalysisRequestSchema = z.object({
  moodEntries: z.array(MoodEntrySnapshotSchema).max(30),
  journalEntries: z.array(JournalEntrySnapshotSchema).max(10),
  examContext: ExamContextSchema.nullable().optional(),
  triggerSummary: z.string().max(800),
});

export const ResultsAnxietyRequestSchema = z.object({
  examContext: ExamContextSchema.nullable().optional(),
  recentMoodLevel: MoodLevelSchema.optional(),
  topTriggers: z.array(ExamStressTriggerSchema).max(8).optional(),
  daysUntilExam: z.number().int().min(0).max(730).optional(),
});

export const JournalInsightRequestSchema = z.object({
  title: z.string().max(MAX_TITLE_LENGTH),
  content: z.string().min(10).max(MAX_CONTENT_LENGTH),
  mood: MoodLevelSchema,
  triggers: z.array(ExamStressTriggerSchema).max(8),
  examContext: ExamContextSchema.nullable().optional(),
});

export type TriggerAnalysisRequest = z.infer<typeof TriggerAnalysisRequestSchema>;
export type ResultsAnxietyRequest = z.infer<typeof ResultsAnxietyRequestSchema>;
export type JournalInsightRequestInput = z.infer<typeof JournalInsightRequestSchema>;
