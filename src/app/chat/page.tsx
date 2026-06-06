import type { Metadata } from "next";
import { WellnessChat } from "@/features/ai/components/wellness-chat";

export const metadata: Metadata = {
  title: "Wellness Chat — MindfulU",
  description: "Talk to your AI wellness companion for support and coping strategies.",
};

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wellness Chat</h1>
        <p className="text-muted-foreground mt-1">
          Your AI companion is here to listen and support you. Share what&apos;s on
          your mind.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <WellnessChat />
      </div>

      <div
        className="max-w-2xl mx-auto rounded-lg bg-amber-50 border border-amber-200 p-4"
        role="note"
        aria-label="Disclaimer"
      >
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> This AI companion provides general wellness
          support and is not a substitute for professional mental health care. If
          you&apos;re experiencing a mental health crisis, please contact a licensed
          professional or crisis line immediately.
        </p>
      </div>
    </div>
  );
}
