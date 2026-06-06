import type { Metadata } from "next";
import { MoodTrackerForm } from "@/features/mood/components/mood-tracker-form";
import { MoodHistory } from "@/features/mood/components/mood-history";
import { ExamContextSetup } from "@/features/exam/components/exam-context-setup";

export const metadata: Metadata = {
  title: "Mood Check-in — MindfulU",
  description:
    "Track how exam preparation is affecting your daily mood, energy, and anxiety levels.",
};

export default function MoodPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mood Check-in</h1>
        <p className="text-muted-foreground mt-1">
          Track how exam preparation is affecting your mood, energy, and anxiety
          every day.
        </p>
      </div>

      <ExamContextSetup compact />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <MoodTrackerForm />
        <MoodHistory />
      </div>
    </div>
  );
}
