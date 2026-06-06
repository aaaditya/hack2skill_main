import type { Metadata } from "next";
import { JournalEntryForm } from "@/features/journal/components/journal-entry-form";
import { JournalList } from "@/features/journal/components/journal-list";

export const metadata: Metadata = {
  title: "Journal — MindfulU",
  description: "Reflect on your emotions and identify stress triggers.",
};

export default function JournalPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reflection Journal</h1>
        <p className="text-muted-foreground mt-1">
          Writing about your experiences builds self-awareness and emotional resilience.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <JournalEntryForm />
        <JournalList />
      </div>
    </div>
  );
}
