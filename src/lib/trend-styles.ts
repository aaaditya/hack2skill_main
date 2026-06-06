/**
 * Shared trend-direction styling used across dashboard components.
 * Single source of truth — avoids duplication in exam-readiness-card,
 * wellness-score-card, top-trigger-card, trigger-trend-list.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { WellnessScore } from "@/types";

export type TrendDirection = WellnessScore["trend"];

export const TREND_ICONS: Record<TrendDirection, typeof TrendingUp> = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

export const TREND_COLORS: Record<TrendDirection, string> = {
  improving: "text-green-600",
  declining: "text-red-600",
  stable: "text-yellow-600",
};

export const TREND_LABELS: Record<TrendDirection, string> = {
  improving: "Improving",
  declining: "Declining",
  stable: "Stable",
};

export const TREND_BADGE_VARIANTS: Record<TrendDirection, string> = {
  improving: "bg-green-100 text-green-800",
  declining: "bg-red-100 text-red-800",
  stable: "bg-yellow-100 text-yellow-800",
};
