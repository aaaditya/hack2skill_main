"use client";

import type { ExamStressTrigger } from "@/types";
import { EXAM_TRIGGER_LABELS } from "@/lib/wellness";

interface TriggerPickerProps {
  selected: ExamStressTrigger[];
  onToggle: (trigger: ExamStressTrigger) => void;
  labelId: string;
  errorId?: string;
  error?: string;
}

const EXAM_TRIGGERS = Object.keys(EXAM_TRIGGER_LABELS) as ExamStressTrigger[];

export function TriggerPicker({
  selected,
  onToggle,
  labelId,
  errorId,
  error,
}: TriggerPickerProps) {
  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error && errorId ? errorId : undefined}
      >
        {EXAM_TRIGGERS.map((trigger) => (
          <button
            key={trigger}
            type="button"
            onClick={() => onToggle(trigger)}
            aria-pressed={selected.includes(trigger)}
            className={`
              rounded-full px-3 py-1 text-sm border-2 transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ${
                selected.includes(trigger)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50"
              }
            `}
          >
            {EXAM_TRIGGER_LABELS[trigger]}
          </button>
        ))}
      </div>
      {error && errorId && (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
