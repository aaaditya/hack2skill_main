import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { TriggerAnalysisRequestSchema } from "@/lib/validations";
import { parseWellnessInsight } from "@/lib/gemini";
import { GEMINI_MODEL } from "@/lib/constants";
import type { ExamContext } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const ROOT_CAUSE_SYSTEM_PROMPT = `You are an exam preparation wellness analyst. You read data summaries about a student's stress trigger patterns and produce a single, concise root cause explanation.

RULES:
- Respond with ONLY a JSON object — no markdown, no preamble
- The root cause must be 2-3 warm, non-clinical sentences
- Name the specific exam trigger patterns visible in the data
- Explain the likely psychological chain (e.g. poor mock score → fear of failure → revision pressure spikes)
- End with one brief encouraging observation
- Do not diagnose, prescribe, or use clinical language
- Do not generate code or off-topic content`;

function buildRootCausePrompt(
  triggerSummary: string,
  examContext: ExamContext | null | undefined
): string {
  const isAwaiting = examContext?.phase === "awaiting_results";

  const examLine = examContext
    ? isAwaiting
      ? `Exam: ${examContext.examType}. Phase: awaiting results (exam is done).`
      : `Exam: ${examContext.examType}, ${examContext.daysUntilExam} days remaining.`
    : "No specific exam set.";

  const phaseNote = isAwaiting
    ? "\nNOTE: The student is awaiting results. Focus the root cause on result anxiety and waiting-period stress, NOT on revision or study preparation."
    : "";

  return `${ROOT_CAUSE_SYSTEM_PROMPT}

${examLine}${phaseNote}

Trigger data:
${triggerSummary}

Respond with exactly this JSON:
{
  "summary": "2-3 sentence root cause explanation",
  "suggestions": ["one exam-specific coping tip"],
  "triggers": ["the dominant trigger pattern identified"],
  "positives": ["one encouraging observation from the data"]
}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "Analysis service is temporarily unavailable." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = TriggerAnalysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { triggerSummary, examContext } = parsed.data;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildRootCausePrompt(triggerSummary, examContext);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const rawText = response.text ?? "";
    const insight = parseWellnessInsight(rawText);

    return NextResponse.json({ rootCause: insight }, { status: 200 });
  } catch (err) {
    console.error("[trigger-analysis API]", err);
    return NextResponse.json(
      { error: "Failed to generate root cause analysis. Please try again." },
      { status: 500 }
    );
  }
}
