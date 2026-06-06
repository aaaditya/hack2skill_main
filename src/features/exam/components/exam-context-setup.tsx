"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExamContextSchema, type ExamContextInput } from "@/lib/validations";
import type { ExamType, ExamPhase } from "@/types";
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
import { GraduationCap, Pencil, BookOpen, Clock } from "lucide-react";
import { DEFAULT_DAYS_UNTIL_EXAM, MAX_DAYS_UNTIL_EXAM, EXAM_TYPES } from "@/lib/constants";
import { formatDaysUntilExam } from "@/lib/wellness";


const EXAM_DESCRIPTIONS: Record<ExamType, string> = {
  NEET: "Medical entrance",
  JEE: "Engineering entrance",
  CUET: "Central university",
  CAT: "MBA entrance",
  GATE: "Graduate engineering",
  UPSC: "Civil services",
  "Class 12 Boards": "12th standard boards",
  "Class 10 Boards": "10th standard boards",
  Other: "Other competitive exam",
};

const PHASE_OPTIONS: Array<{
  value: ExamPhase;
  label: string;
  sublabel: string;
  icon: typeof BookOpen;
}> = [
  {
    value: "preparing",
    label: "Preparing",
    sublabel: "Exam is coming up",
    icon: BookOpen,
  },
  {
    value: "awaiting_results",
    label: "Awaiting Results",
    sublabel: "Exam done, waiting",
    icon: Clock,
  },
];

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
      daysUntilExam: examContext?.daysUntilExam ?? DEFAULT_DAYS_UNTIL_EXAM,
      phase: examContext?.phase ?? "preparing",
    },
  });

  const selectedExam = watch("examType");
  const selectedPhase = watch("phase");

  const onSubmit = useCallback(
    (data: ExamContextInput) => {
      setExamContext(data);
    },
    [setExamContext]
  );

  if (examContext && compact) {
    const phaseLabel =
      examContext.phase === "awaiting_results" ? "Awaiting results" : "Preparing";
    return (
      <div
        className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
        aria-label={`Exam context: ${examContext.examType}, ${phaseLabel}, ${formatDaysUntilExam(examContext.daysUntilExam)} remaining`}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-primary">
              {examContext.examType}
            </p>
            <p className="text-xs text-muted-foreground">
              {phaseLabel}
              {examContext.phase === "preparing" &&
                ` · ${formatDaysUntilExam(examContext.daysUntilExam)} until exam`}
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
          {examContext ? "Update Exam Details" : "Set Your Exam"}
        </CardTitle>
        <CardDescription>
          {examContext
            ? "Update your exam details so all insights stay relevant."
            : "Tell us your exam and where you are in the journey — every insight is tailored to your situation."}
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
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
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

          <fieldset>
            <legend className="text-sm font-medium mb-2">
              Where are you in the journey?
            </legend>
            <div
              className="grid grid-cols-2 gap-3"
              role="group"
              aria-label="Exam phase selection"
            >
              {PHASE_OPTIONS.map(({ value, label, sublabel, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("phase", value, { shouldValidate: true })}
                  aria-pressed={selectedPhase === value}
                  aria-label={`${label}: ${sublabel}`}
                  className={`
                    flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${
                      selectedPhase === value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    }
                  `}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${selectedPhase === value ? "text-primary" : "text-muted-foreground"}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${selectedPhase === value ? "text-primary" : ""}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          {selectedPhase === "preparing" && (
            <div>
              <Label htmlFor="daysUntilExam">Days Until Exam</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  id="daysUntilExam"
                  type="number"
                  min={0}
                  max={MAX_DAYS_UNTIL_EXAM}
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
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {examContext ? "Update" : "Set Exam"}
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
