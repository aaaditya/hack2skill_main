import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WellnessInsightRequestSchema } from "@/lib/validations";
import {
  buildWellnessPrompt,
  parseWellnessInsight,
} from "@/lib/gemini";
import type { MoodEntry } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
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

  const { moodEntries, journalEntries } = parsed.data;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const moodSummary = buildMoodSummary(moodEntries as MoodEntry[]);
    const journalSummary = buildJournalSummary(
      journalEntries.map((j) => ({
        title: j.title,
        content: j.content,
        mood: j.mood,
        triggers: j.triggers,
        timestamp: j.timestamp,
      }))
    );

    const prompt = buildWellnessPrompt(moodSummary, journalSummary);
    const result = await model.generateContent(prompt);

    const rawResponse = result.response;
    const rawText = rawResponse.text();
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
  const lines = recent.map((e) => {
    const date = new Date(e.timestamp).toLocaleDateString();
    return `${date}: mood=${e.moodLevel}/5, energy=${e.energyLevel}/5, anxiety=${e.anxietyLevel}/5, triggers=[${e.triggers.join(",")}], note="${e.notes.slice(0, 80)}"`;
  });

  return lines.join("\n");
}

function buildJournalSummary(
  entries: Array<{ title: string; content: string; mood: number; triggers: string[]; timestamp: string }>
): string {
  if (entries.length === 0) return "No journal entries yet.";

  return entries
    .slice(0, 3)
    .map((e) => {
      const date = new Date(e.timestamp).toLocaleDateString();
      return `[${date}] "${e.title}" (mood ${e.mood}/5): ${e.content.slice(0, 150)}...`;
    })
    .join("\n\n");
}
