import type { Metadata } from "next";
import { ExamReadinessCard } from "@/features/wellness/components/exam-readiness-card";
import { WellnessScoreCard } from "@/features/wellness/components/wellness-score-card";
import { WellnessInsightPanel } from "@/features/wellness/components/wellness-insight-panel";
import { StressTriggerChart } from "@/features/wellness/components/stress-trigger-chart";
import { ExamContextSetup } from "@/features/exam/components/exam-context-setup";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard — MindfulU",
  description:
    "View your exam readiness, wellness score, stress trigger patterns, and AI-powered insights.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your exam preparation wellness overview — readiness, trends, and
          AI-powered insights.
        </p>
      </div>

      <ExamContextSetup compact />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExamReadinessCard />
        <WellnessScoreCard />
      </div>

      <StressTriggerChart />

      <Separator />

      <section aria-labelledby="insights-heading">
        <h2 id="insights-heading" className="text-xl font-semibold mb-4">
          AI Exam Wellness Insights
        </h2>
        <WellnessInsightPanel />
      </section>
    </div>
  );
}
