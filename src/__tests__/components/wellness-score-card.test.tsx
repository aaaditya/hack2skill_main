import React from "react";
import { render, screen } from "@testing-library/react";
import { WellnessScoreCard } from "@/features/wellness/components/wellness-score-card";
import type { WellnessScore, MoodEntry } from "@/types";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

const mockScore: WellnessScore = {
  overall: 72,
  moodAverage: 3.5,
  energyAverage: 3.2,
  anxietyAverage: 2.1,
  journalFrequency: 40,
  trend: "improving",
};

jest.mock("@/features/wellness/hooks/use-wellness-store", () => ({
  useWellnessStore: jest.fn(),
}));

import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
const mockedStore = useWellnessStore as jest.MockedFunction<typeof useWellnessStore>;

function buildState(
  moodEntries: MoodEntry[] = [],
  wellnessScore: WellnessScore | null = null
) {
  return {
    state: {
      moodEntries,
      journalEntries: [],
      chatHistory: [],
      wellnessScore,
      examContext: null,
      isLoaded: true,
    },
    addMoodEntry: jest.fn(),
    addJournalEntry: jest.fn(),
    updateJournalInsight: jest.fn(),
    addChatMessage: jest.fn(),
    setExamContext: jest.fn(),
    clearExamContext: jest.fn(),
    clearChat: jest.fn(),
  };
}

describe("WellnessScoreCard", () => {
  it("shows empty state when no mood entries exist", () => {
    mockedStore.mockReturnValue(buildState([], null));
    render(<WellnessScoreCard />);
    expect(
      screen.getByText(/Complete at least one mood check-in/i)
    ).toBeInTheDocument();
  });

  it("renders overall score when data is available", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("renders trend badge", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    expect(screen.getByText("Improving")).toBeInTheDocument();
  });

  it("renders all three score bar labels", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    expect(screen.getByText("Mood")).toBeInTheDocument();
    expect(screen.getByText("Energy")).toBeInTheDocument();
    expect(screen.getByText("Calm")).toBeInTheDocument();
  });

  it("renders journal activity progress", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    expect(screen.getByText(/Journal Activity/i)).toBeInTheDocument();
  });

  it("shows 'out of 100' label alongside score", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    expect(screen.getByText(/out of 100/i)).toBeInTheDocument();
  });

  it("shows correct aria-label on score element", () => {
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], mockScore));
    render(<WellnessScoreCard />);
    const scoreEl = screen.getByLabelText(/Overall wellness score: 72 out of 100/i);
    expect(scoreEl).toBeInTheDocument();
  });

  it("renders declining trend correctly", () => {
    const declining = { ...mockScore, trend: "declining" as const };
    mockedStore.mockReturnValue(buildState([{ id: "1" } as MoodEntry], declining));
    render(<WellnessScoreCard />);
    expect(screen.getByText("Declining")).toBeInTheDocument();
  });
});
