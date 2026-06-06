import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { WellnessInsightRequestSchema } from "@/lib/validations";
import { buildWellnessPrompt, parseWellnessInsight } from "@/lib/gemini";
import { GEMINI_MODEL } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "Wellness service is temporarily unavailable." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = WellnessInsightRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { moodEntries, journalEntries, examContext } = parsed.data;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const moodSummary = buildMoodSummary(moodEntries);
    const journalSummary = buildJournalSummary(journalEntries);
    const prompt = buildWellnessPrompt(moodSummary, journalSummary, examContext);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const rawText = response.text ?? "";
    const insight = parseWellnessInsight(rawText);

    return NextResponse.json({ insight }, { status: 200 });
  } catch (err) {
    console.error("[wellness API]", err);
    return NextResponse.json(
      { error: "Failed to generate wellness insight. Please try again." },
      { status: 500 }
    );
  }
}

function buildMoodSummary(
  entries: Array<{
    moodLevel: number;
    energyLevel: number;
    anxietyLevel: number;
    triggers: string[];
    notes: string;
    timestamp: string;
  }>
): string {
  if (entries.length === 0) return "No mood data available yet.";

  const recent = entries.slice(0, 7);
  return recent
    .map((e) => {
      const date = new Date(e.timestamp).toLocaleDateString();
      const triggerLabels = e.triggers.map((t) => t.replace(/_/g, " ")).join(", ");
      return `${date}: mood=${e.moodLevel}/5, energy=${e.energyLevel}/5, anxiety=${e.anxietyLevel}/5, triggers=[${triggerLabels || "none"}], note="${e.notes.slice(0, 80)}"`;
    })
    .join("\n");
}

function buildJournalSummary(
  entries: Array<{
    title: string;
    content: string;
    mood: number;
    triggers: string[];
    timestamp: string;
  }>
): string {
  if (entries.length === 0) return "No journal entries yet.";

  return entries
    .slice(0, 3)
    .map((e) => {
      const date = new Date(e.timestamp).toLocaleDateString();
      const triggerLabels = e.triggers.map((t) => t.replace(/_/g, " ")).join(", ");
      return `[${date}] "${e.title}" (mood ${e.mood}/5, triggers: ${triggerLabels || "none"}): ${e.content.slice(0, 150)}...`;
    })
    .join("\n\n");
}
