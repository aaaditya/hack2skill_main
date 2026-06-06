import type { Metadata } from "next";
import { WellnessChat } from "@/features/ai/components/wellness-chat";
import { ExamContextSetup } from "@/features/exam/components/exam-context-setup";

export const metadata: Metadata = {
  title: "Exam Prep Coach — MindfulU",
  description:
    "Talk to your AI exam preparation wellness coach for support, coping strategies, and study advice.",
};

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Prep Coach</h1>
        <p className="text-muted-foreground mt-1">
          Your AI coach understands exam pressure. Share what&apos;s on your mind —
          from mock test anxiety to syllabus backlog.
        </p>
      </div>

      <ExamContextSetup compact />

      <div className="max-w-2xl mx-auto">
        <WellnessChat />
      </div>

      <div
        className="max-w-2xl mx-auto rounded-lg bg-amber-50 border border-amber-200 p-4"
        role="note"
        aria-label="Disclaimer"
      >
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> This AI coach provides general exam preparation
          wellness support and is not a substitute for professional mental health
          care or academic counseling. If you are experiencing severe distress,
          please contact a licensed counselor or your institution&apos;s student
          support services.
        </p>
      </div>
    </div>
  );
}
