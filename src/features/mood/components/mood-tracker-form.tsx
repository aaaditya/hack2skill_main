"use client";

import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoodEntrySchema, type MoodEntryInput } from "@/lib/validations";
import type { MoodLevel, StressTriggerCategory } from "@/types";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { getMoodLabel, getAnxietyLabel } from "@/lib/wellness";

const MOOD_EMOJI: Record<MoodLevel, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const ENERGY_EMOJI: Record<MoodLevel, string> = {
  1: "🪫",
  2: "😴",
  3: "⚡",
  4: "🌟",
  5: "🚀",
};

const TRIGGER_LABELS: Record<StressTriggerCategory, string> = {
  academic: "Academic",
  social: "Social",
  financial: "Financial",
  health: "Health",
  family: "Family",
  other: "Other",
};

const TRIGGER_CATEGORIES = Object.keys(TRIGGER_LABELS) as StressTriggerCategory[];

interface MoodScaleProps {
  id: string;
  value: MoodLevel;
  onChange: (val: MoodLevel) => void;
  label: string;
  description: string;
  getLabel: (v: number) => string;
  emojiMap: Record<MoodLevel, string>;
}

function MoodScale({
  id,
  value,
  onChange,
  label,
  description,
  getLabel,
  emojiMap,
}: MoodScaleProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium mb-1">
        {label}{" "}
        <span className="text-muted-foreground font-normal">— {description}</span>
      </legend>
      <div
        className="flex gap-2 flex-wrap"
        role="group"
        aria-labelledby={`${id}-legend`}
      >
        {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-pressed={value === level}
            aria-label={`${label} ${level}: ${getLabel(level)}`}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[64px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${
                value === level
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }
            `}
          >
            <span className="text-2xl" aria-hidden="true">
              {emojiMap[level]}
            </span>
            <span className="text-xs font-medium">{level}</span>
            <span className="text-xs text-muted-foreground">{getLabel(level)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function MoodTrackerForm() {
  const { addMoodEntry } = useWellnessStore();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MoodEntryInput>({
    resolver: zodResolver(MoodEntrySchema),
    defaultValues: {
      moodLevel: 3,
      energyLevel: 3,
      anxietyLevel: 2,
      notes: "",
      triggers: [],
    },
  });

  const moodLevel = watch("moodLevel");
  const energyLevel = watch("energyLevel");
  const anxietyLevel = watch("anxietyLevel");
  const selectedTriggers = watch("triggers");

  const toggleTrigger = useCallback(
    (trigger: StressTriggerCategory) => {
      const current = selectedTriggers ?? [];
      const next = current.includes(trigger)
        ? current.filter((t) => t !== trigger)
        : [...current, trigger];
      setValue("triggers", next, { shouldValidate: true });
    },
    [selectedTriggers, setValue]
  );

  const onSubmit = useCallback(
    (data: MoodEntryInput) => {
      addMoodEntry(data);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        reset();
      }, 2000);
    },
    [addMoodEntry, reset]
  );

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50" role="status" aria-live="polite">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <CheckCircle className="h-12 w-12 text-green-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-green-800">Check-in saved!</h2>
          <p className="text-sm text-green-700">
            Your mood has been recorded. Head to the dashboard to see your wellness
            trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling?</CardTitle>
        <CardDescription>
          Take a moment to check in with yourself. All entries are private and
          stored locally.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Mood check-in form"
          className="space-y-6"
        >
          <MoodScale
            id="mood"
            value={moodLevel}
            onChange={(v) => setValue("moodLevel", v, { shouldValidate: true })}
            label="Overall Mood"
            description="How are you feeling overall?"
            getLabel={getMoodLabel}
            emojiMap={MOOD_EMOJI}
          />

          <MoodScale
            id="energy"
            value={energyLevel}
            onChange={(v) => setValue("energyLevel", v, { shouldValidate: true })}
            label="Energy Level"
            description="How energized do you feel?"
            getLabel={getMoodLabel}
            emojiMap={ENERGY_EMOJI}
          />

          <MoodScale
            id="anxiety"
            value={anxietyLevel}
            onChange={(v) => setValue("anxietyLevel", v, { shouldValidate: true })}
            label="Anxiety Level"
            description="How anxious or stressed do you feel?"
            getLabel={getAnxietyLabel}
            emojiMap={{
              1: "😌",
              2: "🤔",
              3: "😰",
              4: "😨",
              5: "😱",
            }}
          />

          <div>
            <p className="text-sm font-medium mb-2" id="triggers-label">
              Stress Triggers{" "}
              <span className="text-muted-foreground font-normal">
                — What&apos;s affecting you? (optional)
              </span>
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-labelledby="triggers-label"
            >
              {TRIGGER_CATEGORIES.map((trigger) => (
                <button
                  key={trigger}
                  type="button"
                  onClick={() => toggleTrigger(trigger)}
                  aria-pressed={selectedTriggers?.includes(trigger) ?? false}
                  className={`
                    rounded-full px-3 py-1 text-sm border-2 transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      selectedTriggers?.includes(trigger)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  {TRIGGER_LABELS[trigger]}
                </button>
              ))}
            </div>
            {errors.triggers && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {errors.triggers.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Anything on your mind? (max 500 characters)"
              className="mt-1 resize-none"
              rows={3}
              maxLength={500}
              aria-describedby={errors.notes ? "notes-error" : undefined}
              {...register("notes")}
            />
            {errors.notes && (
              <p id="notes-error" className="mt-1 text-xs text-destructive" role="alert">
                {errors.notes.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Check-in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
