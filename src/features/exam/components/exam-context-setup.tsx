"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExamContextSchema, type ExamContextInput } from "@/lib/validations";
import type { ExamType } from "@/types";
import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Pencil } from "lucide-react";
import { formatDaysUntilExam } from "@/lib/wellness";

const EXAM_TYPES: ExamType[] = [
  "NEET",
  "JEE",
  "CUET",
  "CAT",
  "GATE",
  "UPSC",
  "Board Exams",
  "Other",
];

const EXAM_DESCRIPTIONS: Record<ExamType, string> = {
  NEET: "Medical entrance",
  JEE: "Engineering entrance",
  CUET: "Central university",
  CAT: "MBA entrance",
  GATE: "Graduate engineering",
  UPSC: "Civil services",
  "Board Exams": "10th / 12th boards",
  Other: "Other competitive exam",
};

interface ExamContextSetupProps {
  compact?: boolean;
}

export function ExamContextSetup({ compact = false }: ExamContextSetupProps) {
  const { state, setExamContext, clearExamContext } = useWellnessStore();
  const { examContext } = state;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExamContextInput>({
    resolver: zodResolver(ExamContextSchema),
    defaultValues: {
      examType: examContext?.examType ?? "NEET",
      daysUntilExam: examContext?.daysUntilExam ?? 90,
    },
  });

  const selectedExam = watch("examType");

  const onSubmit = useCallback(
    (data: ExamContextInput) => {
      setExamContext(data);
    },
    [setExamContext]
  );

  if (examContext && compact) {
    return (
      <div
        className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
        aria-label={`Exam context: ${examContext.examType}, ${formatDaysUntilExam(examContext.daysUntilExam)} remaining`}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-primary">
              {examContext.examType}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDaysUntilExam(examContext.daysUntilExam)} until exam
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearExamContext}
          aria-label="Change exam"
          className="text-xs text-muted-foreground h-7"
        >
          <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
          Change
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={examContext ? "border-primary/30" : "border-primary border-2"}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
          {examContext ? "Update Exam Details" : "Set Your Exam Target"}
        </CardTitle>
        <CardDescription>
          {examContext
            ? "Update your exam so insights stay relevant."
            : "Tell us which exam you're preparing for so every insight is tailored to your preparation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label="Exam context form"
          className="space-y-5"
        >
          <fieldset>
            <legend className="text-sm font-medium mb-3">
              Which exam are you preparing for?
            </legend>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              role="group"
              aria-label="Exam type selection"
            >
              {EXAM_TYPES.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setValue("examType", exam, { shouldValidate: true })}
                  aria-pressed={selectedExam === exam}
                  aria-label={`${exam} — ${EXAM_DESCRIPTIONS[exam]}`}
                  className={`
                    flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      selectedExam === exam
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }
                  `}
                >
                  <span className="text-sm font-bold">{exam}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {EXAM_DESCRIPTIONS[exam]}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <Label htmlFor="daysUntilExam">Days Until Exam</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="daysUntilExam"
                type="number"
                min={0}
                max={730}
                className="w-32"
                aria-describedby={
                  errors.daysUntilExam ? "days-error" : "days-hint"
                }
                {...register("daysUntilExam", { valueAsNumber: true })}
              />
              <span
                id="days-hint"
                className="text-sm text-muted-foreground"
                aria-live="polite"
              >
                {watch("daysUntilExam") > 0
                  ? `= ${formatDaysUntilExam(watch("daysUntilExam"))} to go`
                  : "Exam day!"}
              </span>
            </div>
            {errors.daysUntilExam && (
              <p
                id="days-error"
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {errors.daysUntilExam.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {examContext ? "Update Exam" : "Set Exam Target"}
            </Button>
            {examContext && (
              <Button
                type="button"
                variant="outline"
                onClick={clearExamContext}
                aria-label="Remove exam context"
              >
                Remove
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
