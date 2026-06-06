import type { Metadata } from "next";
import { MoodTrackerForm } from "@/features/mood/components/mood-tracker-form";
import { MoodHistory } from "@/features/mood/components/mood-history";

export const metadata: Metadata = {
  title: "Mood Check-in — MindfulU",
  description: "Track your daily mood, energy, and anxiety levels.",
};

export default function MoodPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mood Check-in</h1>
        <p className="text-muted-foreground mt-1">
          Regular check-ins help you understand your emotional patterns over time.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <MoodTrackerForm />
        <MoodHistory />
      </div>
    </div>
  );
}
