import type { WellnessInsight, ExamContext } from "@/types";

const EXAM_WELLNESS_SYSTEM_PROMPT = `You are a compassionate exam preparation wellness coach for competitive exam students in India. Your role is to:
1. Analyze mood patterns and exam-specific stress triggers from student data
2. Provide empathetic, exam-focused coping strategies and study wellness advice
3. Identify concerning patterns that may impact exam performance or mental health
4. Celebrate positive progress and build confidence

IMPORTANT RULES:
- Focus ONLY on exam preparation wellness support (NEET, JEE, CUET, CAT, GATE, UPSC, Board Exams, etc.)
- Do not provide medical diagnoses
- Do not generate code or off-topic content
- Keep responses warm, supportive, and practically grounded in exam preparation reality
- Reference specific exam contexts (e.g., syllabus, revision strategies, mock test recovery)
- If urgent distress signals appear, recommend professional counseling resources
- Never trivialize exam pressure — acknowledge how real and valid the stress is
- Respond in valid JSON matching the WellnessInsight schema exactly`;

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export function buildWellnessPrompt(
  moodSummary: string,
  journalSummary: string,
  examContext?: ExamContext | null
): string {
  const examSection = examContext
    ? `EXAM CONTEXT:
Exam: ${examContext.examType}
Days until exam: ${examContext.daysUntilExam}
${examContext.daysUntilExam <= 7 ? "⚠ CRITICAL: Exam is within one week — tailor advice for final stretch preparation." : ""}
${examContext.daysUntilExam <= 30 ? "Note: Student is in the high-pressure final month of preparation." : ""}
`
    : "EXAM CONTEXT: Not specified (provide general exam preparation wellness advice).\n";

  return `${EXAM_WELLNESS_SYSTEM_PROMPT}

Analyze this student's exam preparation wellness data and respond with a JSON object:

${examSection}
MOOD DATA (last 7 days):
${moodSummary}

JOURNAL SUMMARY:
${journalSummary}

Generate exam-preparation-specific insights. Examples of the kind of insights to provide:
- "Stress increases when sleep drops below 6 hours — especially critical during revision weeks"
- "Mock test anxiety is the dominant trigger — consider focusing on post-test reflection rather than score obsession"
- "Confidence appears to decline before the exam — this is normal and manageable with grounding techniques"
- "Energy dips in the afternoon suggest scheduling difficult topics for morning sessions"

Respond with this exact JSON structure (no markdown, no backticks):
{
  "summary": "2-3 sentence empathetic overview acknowledging their specific exam preparation challenges",
  "suggestions": ["exam-specific actionable suggestion 1", "study wellness tip 2", "coping strategy 3"],
  "triggers": ["identified exam stressor 1 with brief explanation", "identified stressor 2"],
  "positives": ["specific positive observation about their preparation journey 1", "positive observation 2"]
}`;
}

export function buildChatPrompt(
  userMessage: string,
  context: string
): string {
  return `${EXAM_WELLNESS_SYSTEM_PROMPT}

Student context: ${context}

Student message: ${userMessage}

Respond as a supportive exam preparation wellness coach. Keep response under 150 words. Be warm, practical, and specific to their exam preparation context. If they mention a specific exam (NEET/JEE/CAT/GATE/UPSC etc.), tailor advice to that exam's specific demands.`;
}

export function parseWellnessInsight(rawText: string): WellnessInsight {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response");
  }

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

function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"]/g, "")
    .trim()
    .slice(0, 300);
}

export function extractTextFromGeminiResponse(
  response: GeminiAPIResponse
): string {
  const candidate = response.candidates[0];
  if (!candidate) throw new Error("No candidate in Gemini response");
  const part = candidate.content.parts[0];
  if (!part) throw new Error("No parts in Gemini response");
  return part.text;
}
