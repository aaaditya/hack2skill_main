import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JournalInsightRequestSchema } from "@/lib/validations";
import { buildJournalInsightPrompt, sanitizeString } from "@/lib/gemini";
import { GEMINI_MODEL } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "Insight service temporarily unavailable." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = JournalInsightRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { title, content, examContext } = parsed.data;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildJournalInsightPrompt(
      title,
      content,
      examContext
    );
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const insight = sanitizeString(rawText.trim().split("\n")[0] ?? "");

    if (!insight) {
      return NextResponse.json(
        { error: "Could not generate insight." },
        { status: 500 }
      );
    }

    return NextResponse.json({ insight }, { status: 200 });
  } catch (err) {
    console.error("[journal-insight API]", err);
    return NextResponse.json(
      { error: "Failed to generate journal insight." },
      { status: 500 }
    );
  }
}
