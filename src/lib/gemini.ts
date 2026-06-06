import type { WellnessInsight, ExamContext, ExamPhase, ExamType } from "@/types";
import { JOURNAL_INSIGHT_CONTENT_PREVIEW } from "@/lib/constants";

const EXAM_WELLNESS_SYSTEM_PROMPT = `You are a compassionate exam preparation wellness coach for students in India. Your role is to:
1. Analyze mood patterns and exam-specific stress triggers
2. Provide empathetic, context-aware coping strategies and study wellness advice
3. Identify concerning patterns that may impact performance or mental health
4. Build confidence and acknowledge how real exam pressure is

IMPORTANT RULES:
- Focus ONLY on exam preparation and result-season wellness support
- Support all exam types: NEET, JEE, CUET, CAT, GATE, UPSC, Class 10/12 Boards
- Do not provide medical diagnoses or generate code
- Keep responses warm, practical, and grounded in the student's specific situation
- If urgent distress signals appear, recommend professional counseling resources
- Never trivialize exam pressure or result anxiety
- Respond in valid JSON matching the WellnessInsight schema exactly`;

const BOARD_EXAM_GUIDANCE = {
  "Class 12 Boards":
    "Class 12 board exams carry enormous weight — stream choices, college admissions, and family expectations all converge. Acknowledge the pressure of practicals, ISA assessments, and the finality this exam feels like.",
  "Class 10 Boards":
    "Class 10 boards are the first high-stakes milestone. Students face stream-choice anxiety on top of exam pressure. Emphasize that this moment is one step, not a definition.",
} as const satisfies Partial<Record<ExamType, string>>;

type BoardExamType = keyof typeof BOARD_EXAM_GUIDANCE;

function isBoardExam(examType: string): examType is BoardExamType {
  return examType in BOARD_EXAM_GUIDANCE;
}

function buildPhaseSection(phase: ExamPhase | undefined, examType: string): string {
  if (!phase || phase === "preparing") return "";
  return `
⚡ PHASE: AWAITING RESULTS
The student has finished their ${examType} exam and is waiting for results to be declared.
This is the result-season — a distinct high-anxiety period.
- Do NOT give revision or study advice
- Focus on managing the uncertainty of waiting
- Help them process anxiety about what the result might mean
- Reinforce that their worth is not defined by the result
- Suggest healthy ways to occupy the waiting period`;
}

/**
 * Builds the Gemini prompt for periodic wellness insight generation.
 * Phase-aware: switches from revision advice to result-season support
 * when examContext.phase === "awaiting_results".
 */
export function buildWellnessPrompt(
  moodSummary: string,
  journalSummary: string,
  examContext?: ExamContext | null
): string {
  const isAwaiting = examContext?.phase === "awaiting_results";
  const examType = examContext?.examType ?? "";
  const boardNote = isBoardExam(examType)
    ? `\nBOARD EXAM NOTE: ${BOARD_EXAM_GUIDANCE[examType]}`
    : "";

  const examSection = examContext
    ? `EXAM CONTEXT:
Exam: ${examType}
Phase: ${isAwaiting ? "Awaiting results (exam complete)" : "Preparing"}
${isAwaiting ? "" : `Days until exam: ${examContext.daysUntilExam}`}
${!isAwaiting && examContext.daysUntilExam <= 7 ? "⚠ CRITICAL: Exam is within one week — tailor advice for final-stretch preparation." : ""}
${!isAwaiting && examContext.daysUntilExam <= 30 && examContext.daysUntilExam > 7 ? "Note: Student is in the high-pressure final month of preparation." : ""}${boardNote}
${buildPhaseSection(examContext.phase, examType)}`
    : "EXAM CONTEXT: Not specified (provide general exam preparation wellness advice).";

  const insightExamples = isAwaiting
    ? `- "Waiting for results is its own form of exam — the uncertainty is genuinely difficult"
- "Result anxiety tends to peak 1-2 weeks before declaration — this is normal and temporary"
- "Filling waiting time with meaningful activity helps quiet the result-spiral"`
    : `- "Stress increases when sleep drops below 6 hours — especially critical during revision weeks"
- "Mock test anxiety is the dominant trigger — consider post-test reflection over score obsession"
- "Confidence tends to dip in the final month — grounding techniques can stabilize it"`;

  return `${EXAM_WELLNESS_SYSTEM_PROMPT}

Analyze this student's wellness data and respond with a JSON object:

${examSection}

MOOD DATA (last 7 days):
${moodSummary}

JOURNAL SUMMARY:
${journalSummary}

Generate context-specific insights. Examples:
${insightExamples}

Respond with this exact JSON structure (no markdown, no backticks):
{
  "summary": "2-3 sentence empathetic overview of their current situation",
  "suggestions": ["specific actionable suggestion 1", "coping strategy 2", "wellness tip 3"],
  "triggers": ["identified stressor 1 with brief explanation", "identified stressor 2"],
  "positives": ["specific positive observation 1", "positive observation 2"]
}`;
}

/**
 * Builds the Gemini prompt for the real-time exam prep chat coach.
 * Context string must include exam type, phase, mood, and active triggers.
 */
export function buildChatPrompt(userMessage: string, context: string): string {
  return `${EXAM_WELLNESS_SYSTEM_PROMPT}

Student context: ${context}

Student message: ${userMessage}

Respond as a supportive wellness coach. Keep response under 150 words. Be warm and practical. If the student is awaiting results, focus on managing uncertainty rather than study advice. If they mention a board exam (Class 10/12), acknowledge the unique pressures of stream-choice anxiety and parental expectations.`;
}

export function buildJournalInsightPrompt(
  title: string,
  content: string,
  examContext?: ExamContext | null
): string {
  const examLine = examContext
    ? `Exam: ${examContext.examType}, Phase: ${examContext.phase === "awaiting_results" ? "awaiting results" : "preparing"}.`
    : "";

  return `You are a compassionate exam wellness coach. A student has written a journal entry. Generate a single supportive sentence (max 60 words) that:
- Acknowledges one specific thing they expressed
- Offers one gentle perspective or encouragement
- Uses warm, non-clinical language

${examLine}

Journal title: "${title}"
Journal entry: "${content.slice(0, JOURNAL_INSIGHT_CONTENT_PREVIEW)}"

Respond with ONLY the insight sentence. No JSON. No preamble.`;
}

export function parseWellnessInsight(rawText: string): WellnessInsight {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!isWellnessInsightShape(parsed)) {
    throw new Error("AI response does not match expected shape");
  }

  return {
    summary: sanitizeString(parsed.summary),
    suggestions: parsed.suggestions.map(sanitizeString).slice(0, 5),
    triggers: parsed.triggers.map(sanitizeString).slice(0, 5),
    positives: parsed.positives.map(sanitizeString).slice(0, 5),
  };
}

function isWellnessInsightShape(value: unknown): value is {
  summary: string;
  suggestions: string[];
  triggers: string[];
  positives: string[];
} {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["summary"] === "string" &&
    Array.isArray(obj["suggestions"]) &&
    Array.isArray(obj["triggers"]) &&
    Array.isArray(obj["positives"])
  );
}

/**
 * Strips HTML, removes dangerous chars, and caps length.
 * Applied to all AI response strings before storage or display.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"]/g, "")
    .trim()
    .slice(0, 300);
}
