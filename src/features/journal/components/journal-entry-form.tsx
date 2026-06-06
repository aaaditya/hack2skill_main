"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { JournalEntrySchema, type JournalEntryInput } from "@/lib/validations";
import type { MoodLevel, ExamStressTrigger } from "@/types";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TriggerPicker } from "@/components/shared/trigger-picker";
import { postJson } from "@/lib/api-client";
import { SUCCESS_DISPLAY_MS } from "@/lib/constants";
import { SubmissionSuccessCard } from "@/components/shared/submission-success-card";
import { toggleTriggerValue } from "@/lib/form-utils";
import { Loader2, Sparkles } from "lucide-react";
import { getMoodLabel } from "@/lib/wellness";

const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const MOOD_LEVELS = [1, 2, 3, 4, 5] as const satisfies readonly MoodLevel[];

const REFLECTION_PROMPTS = [
  "What study topic challenged me the most today and why?",
  "How did I feel before and after my revision session today?",
  "What would I do differently in tomorrow's study schedule?",
  "What is one thing I understood well today that I can build on?",
  "How is exam pressure affecting my daily routine and sleep?",
  "What am I most anxious about and what can I control vs. not?",
  "Describe a moment today when I felt confident in my preparation.",
];

export function JournalEntryForm() {
  const { addJournalEntry, updateJournalInsight, state } = useWellnessStore();
  const [submitted, setSubmitted] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JournalEntryInput>({
    resolver: zodResolver(JournalEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      mood: 3,
      triggers: [],
    },
  });

  const moodValue = watch("mood");
  const selectedTriggers = watch("triggers");
  const contentValue = watch("content");

  const toggleTrigger = useCallback(
    (trigger: ExamStressTrigger) => {
      setValue("triggers", toggleTriggerValue(selectedTriggers ?? [], trigger), {
        shouldValidate: true,
      });
    },
    [selectedTriggers, setValue]
  );

  const cyclePrompt = useCallback(() => {
    setPromptIndex((i) => (i + 1) % REFLECTION_PROMPTS.length);
  }, []);

  const applyPrompt = useCallback(() => {
    const current = contentValue ?? "";
    const prompt = REFLECTION_PROMPTS[promptIndex] ?? "";
    if (current.trim() === "") {
      setValue("content", prompt + "\n\n", { shouldValidate: true });
    } else {
      setValue("content", current + "\n\n" + prompt + "\n\n", {
        shouldValidate: true,
      });
    }
  }, [contentValue, promptIndex, setValue]);

  const onSubmit = useCallback(
    (data: JournalEntryInput) => {
      const entryId = addJournalEntry(data);
      setSubmitted(true);

      // Fire background AI insight — does not block the success state
      void postJson<{ insight: string }>("/api/journal-insight", {
        title: data.title,
        content: data.content,
        mood: data.mood,
        triggers: data.triggers,
        examContext: state.examContext ?? null,
      })
        .then((result) => {
          if (result.insight) updateJournalInsight(entryId, result.insight);
        })
        .catch(() => {
          // Insight is optional — silently ignore API failures
        });

      setTimeout(() => {
        setSubmitted(false);
        reset();
      }, SUCCESS_DISPLAY_MS);
    },
    [addJournalEntry, updateJournalInsight, reset, state.examContext]
  );

  const examLabel = state.examContext?.examType ?? "exam";

  if (submitted) {
    return (
      <SubmissionSuccessCard
        heading="Journal entry saved!"
        message="Great job reflecting. Visit your dashboard for exam-focused AI insights."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Reflection</CardTitle>
        <CardDescription>
          Reflect on your {examLabel} preparation. Regular journaling helps
          you understand your stress patterns and study more effectively.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Study reflection journal form"
          className="space-y-5"
        >
          <div>
            <Label htmlFor="title">Entry Title</Label>
            <Input
              id="title"
              placeholder="e.g. Post mock test reflection, Syllabus anxiety day..."
              className="mt-1"
              maxLength={100}
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p
                id="title-error"
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="content">Your Reflection</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPrompt}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                  aria-label={`Use reflection prompt: ${REFLECTION_PROMPTS[promptIndex]}`}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Use prompt
                </button>
                <button
                  type="button"
                  onClick={cyclePrompt}
                  className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                  aria-label="Get different reflection prompt"
                >
                  Next prompt
                </button>
              </div>
            </div>
            <p
              className="text-xs text-muted-foreground italic mb-1"
              aria-live="polite"
            >
              Prompt: {REFLECTION_PROMPTS[promptIndex]}
            </p>
            <Textarea
              id="content"
              placeholder="Write about your study session, how you're coping with exam pressure, what's on your mind..."
              className="mt-1 resize-none"
              rows={6}
              maxLength={2000}
              aria-describedby={
                errors.content ? "content-error" : "content-count"
              }
              {...register("content")}
            />
            <div className="flex justify-between mt-1">
              {errors.content ? (
                <p
                  id="content-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.content.message}
                </p>
              ) : (
                <span />
              )}
              <span
                id="content-count"
                className="text-xs text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {(contentValue ?? "").length}/2000
              </span>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">
              How are you feeling about your preparation?
            </legend>
            <div className="flex gap-2 flex-wrap" role="group">
              {MOOD_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setValue("mood", level, { shouldValidate: true })
                  }
                  aria-pressed={moodValue === level}
                  aria-label={`Mood: ${getMoodLabel(level)}`}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[56px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      moodValue === level
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }
                  `}
                >
                  <span className="text-xl" aria-hidden="true">
                    {MOOD_EMOJIS[level]}
                  </span>
                  <span className="text-xs">{getMoodLabel(level)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <p
              className="text-sm font-medium mb-2"
              id="journal-triggers-label"
            >
              Exam stressors in this entry{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </p>
            <TriggerPicker
              selected={selectedTriggers ?? []}
              onToggle={toggleTrigger}
              labelId="journal-triggers-label"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Saving entry...</span>
              </>
            ) : (
              "Save Reflection"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
