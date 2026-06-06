import type { WellnessInsight } from "@/types";

const SYSTEM_PROMPT = `You are a compassionate student wellness support assistant. Your role is to:
1. Analyze mood patterns and stress triggers from student data
2. Provide empathetic, actionable wellness suggestions
3. Identify concerning patterns that may need attention
4. Celebrate positive progress

IMPORTANT RULES:
- Focus ONLY on student wellness support
- Do not provide medical diagnoses
- Do not generate code or off-topic content
- Keep responses warm, supportive, and evidence-based
- If urgent distress signals appear, recommend professional resources
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
  journalSummary: string
): string {
  return `${SYSTEM_PROMPT}

Analyze this student wellness data and respond with a JSON object:

MOOD DATA:
${moodSummary}

JOURNAL SUMMARY:
${journalSummary}

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence empathetic overview",
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "triggers": ["identified trigger 1", "identified trigger 2"],
  "positives": ["positive observation 1", "positive observation 2"]
}`;
}

export function buildChatPrompt(
  userMessage: string,
  context: string
): string {
  return `${SYSTEM_PROMPT}

Student context: ${context}

Student message: ${userMessage}

Respond as a supportive wellness assistant. Keep response under 150 words. Be warm and practical.`;
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
