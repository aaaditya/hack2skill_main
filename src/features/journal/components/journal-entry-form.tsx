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
import { TriggerPicker } from "@/components/shared/trigger-picker";import { CheckCircle, Loader2, Sparkles } from "lucide-react";

const MOOD_OPTIONS: Array<{ value: MoodLevel; label: string; emoji: string }> = [
  { value: 1, label: "Very Low", emoji: "😞" },
  { value: 2, label: "Low", emoji: "😕" },
  { value: 3, label: "Moderate", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Excellent", emoji: "😄" },
];

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
      const current = selectedTriggers ?? [];
      const next = current.includes(trigger)
        ? current.filter((t) => t !== trigger)
        : [...current, trigger];
      setValue("triggers", next, { shouldValidate: true });
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
      void fetch("/api/journal-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          mood: data.mood,
          triggers: data.triggers,
          examContext: state.examContext ?? null,
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((result: unknown) => {
          const insight = (result as { insight?: string }).insight;
          if (insight) updateJournalInsight(entryId, insight);
        })
        .catch(() => {
          // Insight is optional — silently ignore API failures
        });

      setTimeout(() => {
        setSubmitted(false);
        reset();
      }, 2500);
    },
    [addJournalEntry, updateJournalInsight, reset, state.examContext]
  );

  const examLabel = state.examContext?.examType ?? "exam";

  if (submitted) {
    return (
      <Card
        className="border-green-200 bg-green-50"
        role="status"
        aria-live="polite"
      >
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <CheckCircle
            className="h-12 w-12 text-green-600"
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold text-green-800">
            Journal entry saved!
          </h2>
          <p className="text-sm text-green-700">
            Great job reflecting. Visit your dashboard for exam-focused AI
            insights.
          </p>
        </CardContent>
      </Card>
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
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setValue("mood", opt.value, { shouldValidate: true })
                  }
                  aria-pressed={moodValue === opt.value}
                  aria-label={`Mood: ${opt.label}`}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[56px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      moodValue === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }
                  `}
                >
                  <span className="text-xl" aria-hidden="true">
                    {opt.emoji}
                  </span>
                  <span className="text-xs">{opt.label}</span>
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
