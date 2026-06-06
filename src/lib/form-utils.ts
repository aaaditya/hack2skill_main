import type { ExamStressTrigger } from "@/types";

/**
 * Pure function — computes the next trigger array when toggling a value.
 * Adds the trigger if absent; removes it if present.
 */
export function toggleTriggerValue(
  current: ExamStressTrigger[],
  trigger: ExamStressTrigger
): ExamStressTrigger[] {
  return current.includes(trigger)
    ? current.filter((t) => t !== trigger)
    : [...current, trigger];
}
