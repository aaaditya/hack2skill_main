import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ChatMessageSchema } from "@/lib/validations";
import { buildChatPrompt, parseCoachResponse } from "@/lib/gemini";
import { GEMINI_MODEL } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat service is temporarily unavailable." },
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

  const parsed = ChatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { message, context } = parsed.data;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const triggerLabels = (context?.recentTriggers ?? [])
      .map((t) => t.replace(/_/g, " "))
      .join(", ");

    const examInfo = context?.examType
      ? ` ${context.phase === "awaiting_results" ? "Awaiting results for" : "Preparing for"}: ${context.examType}.${context.daysUntilExam !== undefined && context.phase !== "awaiting_results" ? ` ${context.daysUntilExam} days until exam.` : ""}`
      : "";

    const contextStr = context
      ? `Recent mood: ${context.recentMoodLevel ?? "unknown"}/5. Exam stressors: ${triggerLabels || "none"}.${examInfo}`
      : "No additional context available.";

    const prompt = buildChatPrompt(message, contextStr);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const reply = response.text ?? "";
    const sanitizedReply = parseCoachResponse(reply);

    return NextResponse.json({ reply: sanitizedReply }, { status: 200 });
  } catch (err) {
    console.error("[chat API]", err);
    return NextResponse.json(
      { error: "Failed to process your message. Please try again." },
      { status: 500 }
    );
  }
}
