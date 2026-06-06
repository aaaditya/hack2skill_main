"use client";

import { useCallback, useMemo, useState } from "react";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import { buildTriggerAnalysis, shouldActivateResultsAnxietyMode } from "@/lib/trigger-analysis";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Star,
  Loader2,
  RefreshCw,
  Shield,
  Lightbulb,
  User,
} from "lucide-react";
import { AiErrorAlert } from "@/components/shared/ai-error-alert";
import type { ResultsAnxietyGuidance } from "@/types";

const WORTH_REMINDER = `Your value as a person has nothing to do with a number on a result sheet.
Exams measure your preparation on one day — they do not measure your curiosity,
your resilience, your kindness, or your potential. Many paths lead to a meaningful life,
and none of them require a perfect score.`;

const STATIC_COPING_RECOMMENDATIONS: Array<{
  icon: typeof Heart;
  title: string;
  description: string;
}> = [
  {
    icon: Shield,
    title: "Separate identity from outcome",
    description:
      "Remind yourself: \"I am a person who is taking an exam\" — not \"I am my exam result.\" You existed fully before this result, and you will after.",
  },
  {
    icon: Heart,
    title: "Feel the feeling, don't fight it",
    description:
      "Anxiety about results is natural. Let yourself feel nervous without amplifying it with worst-case thoughts. Acknowledge: \"I am anxious, and that is okay.\"",
  },
  {
    icon: Lightbulb,
    title: "Name three things you can control",
    description:
      "You cannot control the result, but you can control how you rest today, how you treat yourself, and who you talk to. Focus effort only where you have agency.",
  },
  {
    icon: User,
    title: "Talk to someone who knows you",
    description:
      "Results anxiety grows in isolation. Share what you are feeling with a friend, sibling, or mentor — not to solve it, but to not carry it alone.",
  },
  {
    icon: Star,
    title: "Write a letter to your past self",
    description:
      "The version of you who started this preparation could never have imagined how far you have come. Recognise your growth, not just your score.",
  },
  {
    icon: Shield,
    title: "Ground yourself in the present",
    description:
      "Take five slow breaths. Notice five things you can see. The result is not happening right now — you are safe in this moment.",
  },
];

function WorthReminderCard() {
  return (
    <Card
      className="border-primary border-2 bg-primary/5"
      aria-labelledby="worth-reminder-heading"
    >
      <CardHeader className="pb-2">
        <CardTitle
          id="worth-reminder-heading"
          className="flex items-center gap-2 text-primary"
        >
          <Heart className="h-5 w-5" aria-hidden="true" />
          You are more than your results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {WORTH_REMINDER}
        </p>
      </CardContent>
    </Card>
  );
}

function CopingRecommendations() {
  return (
    <section aria-labelledby="coping-heading">
      <h3
        id="coping-heading"
        className="text-base font-semibold mb-3"
      >
        Ways to cope right now
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {STATIC_COPING_RECOMMENDATIONS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-lg border border-border bg-card p-4 space-y-1.5"
            role="article"
            aria-label={title}
          >
            <div className="flex items-center gap-2">
              <Icon
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <h4 className="text-sm font-semibold">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FutureSelfPanel({
  guidance,
  isLoading,
  error,
  onFetch,
}: {
  guidance: ResultsAnxietyGuidance | null;
  isLoading: boolean;
  error: string | null;
  onFetch: () => void;
}) {
  return (
    <Card aria-labelledby="future-self-heading">
      <CardHeader className="pb-2">
        <CardTitle
          id="future-self-heading"
          className="flex items-center gap-2 text-base"
        >
          <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          A message from your future self
        </CardTitle>
        <CardDescription>
          AI-generated. Your future self has been through this moment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <AiErrorAlert message={error} />}

        {guidance && !isLoading && (
          <div className="space-y-4" aria-live="polite">
            <blockquote className="border-l-4 border-primary pl-4">
              <p className="text-sm leading-relaxed italic text-foreground">
                &ldquo;{guidance.futureSelfMessage}&rdquo;
              </p>
            </blockquote>

            {guidance.specializedGuidance.length > 0 && (
              <section aria-labelledby="ai-guidance-heading">
                <h4
                  id="ai-guidance-heading"
                  className="text-sm font-semibold mb-2"
                >
                  Personalised guidance
                </h4>
                <ul className="space-y-2">
                  {guidance.specializedGuidance.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span
                        className="shrink-0 text-primary mt-0.5"
                        aria-hidden="true"
                      >
                        ✦
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <Button
          onClick={onFetch}
          disabled={isLoading}
          variant={guidance ? "outline" : "default"}
          className="w-full"
          aria-label={
            guidance
              ? "Generate a new message from future self"
              : "Generate message from future self"
          }
        >
          {isLoading ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span>Writing your message...</span>
            </>
          ) : guidance ? (
            <>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Generate new message</span>
            </>
          ) : (
            "Read message from your future self"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResultsAnxietyMode() {
  const { state } = useWellnessStore();
  const [guidance, setGuidance] = useState<ResultsAnxietyGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(
    () => buildTriggerAnalysis(state.moodEntries, state.journalEntries),
    [state.moodEntries, state.journalEntries]
  );

  // Activate when the student is in the awaiting_results phase OR when
  // results_anxiety is a top trigger with low-mood entries
  const isActive = useMemo(
    () =>
      state.examContext?.phase === "awaiting_results" ||
      shouldActivateResultsAnxietyMode(analysis.frequencies),
    [state.examContext?.phase, analysis.frequencies]
  );

  const fetchGuidance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/results-anxiety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examContext: state.examContext ?? null,
          recentMoodLevel: state.moodEntries[0]?.moodLevel,
          topTriggers: analysis.frequencies
            .slice(0, 5)
            .map((f) => f.trigger),
          daysUntilExam: state.examContext?.daysUntilExam,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ?? "Service unavailable"
        );
      }

      const data = (await response.json()) as {
        guidance: ResultsAnxietyGuidance;
      };
      setGuidance(data.guidance);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate message. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [state.examContext, state.moodEntries, analysis.frequencies]);

  if (!isActive) return null;

  return (
    <section
      aria-labelledby="results-anxiety-heading"
      className="space-y-5"
    >
      <div className="flex items-center gap-2">
        <h2
          id="results-anxiety-heading"
          className="text-xl font-semibold"
        >
          {state.examContext?.phase === "awaiting_results"
            ? "Result Season Support"
            : "Results Anxiety Support"}
        </h2>
        <span
          className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold"
          aria-label={
            state.examContext?.phase === "awaiting_results"
              ? "Active: you are currently awaiting results"
              : "Active: results anxiety detected as a primary stressor"
          }
        >
          Active
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        {state.examContext?.phase === "awaiting_results"
          ? `You've set your phase to "Awaiting Results" for ${state.examContext.examType ?? "your exam"}. Everything here is designed to help you through this waiting period.`
          : "Results anxiety has appeared as a primary stressor in your recent entries. Everything here is designed to help you through this."}
      </p>

      <WorthReminderCard />

      <FutureSelfPanel
        guidance={guidance}
        isLoading={isLoading}
        error={error}
        onFetch={fetchGuidance}
      />

      <Separator />

      <CopingRecommendations />
    </section>
  );
}
