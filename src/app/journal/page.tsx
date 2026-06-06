import type { Metadata } from "next";
import { JournalEntryForm } from "@/features/journal/components/journal-entry-form";
import { JournalList } from "@/features/journal/components/journal-list";
import { ExamContextSetup } from "@/features/exam/components/exam-context-setup";

export const metadata: Metadata = {
  title: "Study Reflection — MindfulU",
  description:
    "Reflect on your exam preparation, study sessions, and emotional wellbeing.",
};

export default function JournalPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Reflection</h1>
        <p className="text-muted-foreground mt-1">
          Reflect on your preparation journey. Writing helps you understand your
          stress patterns and study more effectively.
        </p>
      </div>

      <ExamContextSetup compact />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <JournalEntryForm />
        <JournalList />
      </div>
    </div>
  );
}
