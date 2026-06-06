import type { Metadata } from "next";
import { WellnessScoreCard } from "@/features/wellness/components/wellness-score-card";
import { WellnessInsightPanel } from "@/features/wellness/components/wellness-insight-panel";
import { StressTriggerChart } from "@/features/wellness/components/stress-trigger-chart";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard — MindfulU",
  description: "View your wellness score, trends, and AI-powered insights.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wellness Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your wellness overview based on recent check-ins and journal entries.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WellnessScoreCard />
        <StressTriggerChart />
      </div>

      <Separator />

      <section aria-labelledby="insights-heading">
        <h2
          id="insights-heading"
          className="text-xl font-semibold mb-4"
        >
          AI-Powered Insights
        </h2>
        <WellnessInsightPanel />
      </section>
    </div>
  );
}
