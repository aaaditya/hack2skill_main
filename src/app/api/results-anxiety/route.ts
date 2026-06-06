import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResultsAnxietyRequestSchema } from "@/lib/validations";
import { sanitizeString } from "@/lib/gemini";
import { GEMINI_MODEL } from "@/lib/constants";
import { EXAM_TRIGGER_LABELS } from "@/lib/wellness";
import type { ResultsAnxietyGuidance, ExamStressTrigger } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const RESULTS_ANXIETY_SYSTEM_PROMPT = `You are a compassionate wellness coach who specialises in helping students navigate result anxiety and the uncertain waiting period after exams. Your tone is warm, grounded, and non-clinical — like a wise friend who has been through this.

RULES:
- Respond with ONLY a JSON object — no markdown, no backticks
- Never trivialise result anxiety — it is a real and valid emotional experience
- Never give medical advice or diagnose
- The Future Self message should be personal, hopeful, and anchored in possibility — not toxic positivity
- Guidance must be practical, not generic platitudes
- Language must be supportive, not preachy
- Do not generate code or off-topic content`;

function buildResultsAnxietyPrompt(
  examType: string | undefined,
  phase: string | undefined,
  daysUntilExam: number | undefined,
  recentMoodLevel: number | undefined,
  topTriggers: ExamStressTrigger[] | undefined
): string {
  const isAwaiting = phase === "awaiting_results";

  const examLine = examType
    ? `Exam: ${examType}. Phase: ${isAwaiting ? "Awaiting results (exam is done)" : `Preparing (${daysUntilExam ?? "?"} days remaining)`}.`
    : "Exam type not specified.";

  const moodLine = recentMoodLevel
    ? `Current mood level: ${recentMoodLevel}/5.`
    : "";

  const triggerLine =
    topTriggers && topTriggers.length > 0
      ? `Active stressors: ${topTriggers.map((t) => EXAM_TRIGGER_LABELS[t]).join(", ")}.`
      : "";

  const phaseGuidance = isAwaiting
    ? `The student is in the result-waiting period. Focus on:
- Managing uncertainty and the "what if" thought spiral
- Redirecting energy constructively during the wait
- Separating self-worth from the result
- Preparing emotionally for any outcome (not just failure)`
    : `The student is anxious about upcoming results. Focus on:
- Managing anticipatory anxiety
- Preventing worst-case-scenario thinking
- Building resilience regardless of outcome`;

  return `${RESULTS_ANXIETY_SYSTEM_PROMPT}

Student context:
${examLine}
${moodLine}
${triggerLine}

${phaseGuidance}

Generate personalised support. Respond with exactly this JSON:
{
  "futureSelfMessage": "A 3-4 sentence message from their future self — someone who has been through this moment and come out the other side. Personal, warm, forward-looking. Reference the specific exam if provided.",
  "specializedGuidance": [
    "Practical coping strategy specific to their active stressors",
    "Strategy for breaking the result-anxiety thought spiral",
    "Strategy for maintaining self-worth independent of any result",
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
    futureSelfMessage: sanitizeString(parsed.futureSelfMessage),
    specializedGuidance: parsed.specializedGuidance.map(sanitizeString).slice(0, 6),
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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const { examContext, recentMoodLevel, topTriggers, daysUntilExam } = parsed.data;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildResultsAnxietyPrompt(
      examContext?.examType,
      examContext?.phase,
      daysUntilExam ?? examContext?.daysUntilExam,
      recentMoodLevel,
      topTriggers
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
