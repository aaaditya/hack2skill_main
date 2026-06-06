import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessageSchema } from "@/lib/validations";
import { buildChatPrompt } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    const sanitizedReply = reply.replace(/<[^>]*>/g, "").slice(0, 1000);

    return NextResponse.json({ reply: sanitizedReply }, { status: 200 });
  } catch (err) {
    console.error("[chat API]", err);
    return NextResponse.json(
      { error: "Failed to process your message. Please try again." },
      { status: 500 }
    );
  }
}
