import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResultsAnxietyRequestSchema } from "@/lib/validations";
import type { ResultsAnxietyGuidance } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const RESULTS_ANXIETY_SYSTEM_PROMPT = `You are a compassionate exam preparation wellness coach who specialises in helping students manage result anxiety. Your tone is warm, grounded, and non-clinical — like a wise friend who has helped many exam students before.

RULES:
- Respond with ONLY a JSON object — no markdown, no backticks
- Never trivialise the student's anxiety — results feel enormously important and that is valid
- Never give medical advice or diagnose
- The Future Self message should be personal, hopeful, and anchored in possibility — not toxic positivity
- Guidance must be practical, not generic platitudes
- Language must be supportive, not preachy
- Do not generate code or off-topic content`;

function buildResultsAnxietyPrompt(
  examType: string | undefined,
  daysUntilExam: number | undefined,
  recentMoodLevel: number | undefined
): string {
  const examLine = examType
    ? `Preparing for: ${examType}.${daysUntilExam !== undefined ? ` ${daysUntilExam} days remaining.` : ""}`
    : "Exam type not specified.";

  const moodLine = recentMoodLevel
    ? `Current mood level: ${recentMoodLevel}/5.`
    : "";

  return `${RESULTS_ANXIETY_SYSTEM_PROMPT}

Student context:
${examLine}
${moodLine}
Primary trigger: Results Anxiety

Generate personalised support for this student. Respond with exactly this JSON:
{
  "futureSelfMessage": "A 3-4 sentence message from their future self — someone who has been through this moment and come out the other side. Personal, warm, and forward-looking.",
  "specializedGuidance": [
    "Practical, specific coping strategy for results anxiety",
    "Strategy for breaking the worry-spiral",
    "Strategy for maintaining self-worth independent of results",
    "One grounding technique for acute anxiety moments"
  ]
}`;
}

function parseResultsAnxietyResponse(rawText: string): ResultsAnxietyGuidance {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!isResultsAnxietyShape(parsed)) {
    throw new Error("AI response does not match expected shape");
  }

  return {
    futureSelfMessage: sanitize(parsed.futureSelfMessage),
    specializedGuidance: parsed.specializedGuidance.map(sanitize).slice(0, 6),
  };
}

function isResultsAnxietyShape(value: unknown): value is {
  futureSelfMessage: string;
  specializedGuidance: string[];
} {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["futureSelfMessage"] === "string" &&
    Array.isArray(obj["specializedGuidance"])
  );
}

function sanitize(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"]/g, "")
    .trim()
    .slice(0, 500);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "Support service is temporarily unavailable." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = ResultsAnxietyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { examContext, recentMoodLevel, daysUntilExam } = parsed.data;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = buildResultsAnxietyPrompt(
      examContext?.examType,
      daysUntilExam ?? examContext?.daysUntilExam,
      recentMoodLevel
    );
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const guidance = parseResultsAnxietyResponse(rawText);

    return NextResponse.json({ guidance }, { status: 200 });
  } catch (err) {
    console.error("[results-anxiety API]", err);
    return NextResponse.json(
      { error: "Failed to generate support message. Please try again." },
      { status: 500 }
    );
  }
}
