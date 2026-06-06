import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MoodTrackerForm } from "@/features/mood/components/mood-tracker-form";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

const mockAddMoodEntry = jest.fn();

jest.mock("@/features/wellness/hooks/use-wellness-store", () => ({
  useWellnessStore: jest.fn(() => ({
    state: {
      moodEntries: [],
      journalEntries: [],
      chatHistory: [],
      wellnessScore: null,
      examContext: null,
      isLoaded: true,
    },
    addMoodEntry: mockAddMoodEntry,
    addJournalEntry: jest.fn(),
    updateJournalInsight: jest.fn(),
    addChatMessage: jest.fn(),
    setExamContext: jest.fn(),
    clearExamContext: jest.fn(),
    clearChat: jest.fn(),
  })),
}));

beforeEach(() => jest.clearAllMocks());

describe("MoodTrackerForm", () => {
  it("renders the form with all three mood scale fieldsets", () => {
    render(<MoodTrackerForm />);
    expect(screen.getByText("Overall Mood")).toBeInTheDocument();
    expect(screen.getByText("Study Energy")).toBeInTheDocument();
    expect(screen.getByText("Exam Anxiety")).toBeInTheDocument();
  });

  it("renders 5 level buttons for each mood scale (15 total scale buttons)", () => {
    render(<MoodTrackerForm />);
    // Each level 1-5 appears in each of the three scales
    const pressedButtons = screen.getAllByRole("button", { pressed: false });
    // At minimum all 15 scale buttons plus the submit button
    expect(pressedButtons.length).toBeGreaterThanOrEqual(15);
  });

  it("renders the Save Check-in submit button", () => {
    render(<MoodTrackerForm />);
    expect(screen.getByRole("button", { name: /Save Check-in/i })).toBeInTheDocument();
  });

  it("renders the notes textarea", () => {
    render(<MoodTrackerForm />);
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
  });

  it("renders trigger picker buttons for exam stressors", () => {
    render(<MoodTrackerForm />);
    expect(screen.getByRole("button", { name: /Mock Test Performance/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Results Anxiety/i })).toBeInTheDocument();
  });

  it("marks mood scale button as pressed when clicked", () => {
    render(<MoodTrackerForm />);
    // Find level-5 button for Overall Mood (aria-label contains "Overall Mood 5")
    const level5Button = screen.getByRole("button", {
      name: /Overall Mood 5/i,
    });
    fireEvent.click(level5Button);
    expect(level5Button).toHaveAttribute("aria-pressed", "true");
  });

  it("marks trigger button as pressed when clicked", () => {
    render(<MoodTrackerForm />);
    const trigger = screen.getByRole("button", { name: /Syllabus Backlog/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-pressed", "true");
  });

  it("shows success state after form submission", async () => {
    render(<MoodTrackerForm />);
    fireEvent.click(screen.getByRole("button", { name: /Save Check-in/i }));
    await waitFor(() =>
      expect(screen.getByText(/Check-in saved!/i)).toBeInTheDocument()
    );
  });

  it("calls addMoodEntry on submit", async () => {
    render(<MoodTrackerForm />);
    fireEvent.click(screen.getByRole("button", { name: /Save Check-in/i }));
    await waitFor(() => expect(mockAddMoodEntry).toHaveBeenCalledTimes(1));
  });

  it("passes correct default mood levels to addMoodEntry", async () => {
    render(<MoodTrackerForm />);
    fireEvent.click(screen.getByRole("button", { name: /Save Check-in/i }));
    await waitFor(() => {
      const [entry] = mockAddMoodEntry.mock.calls[0] as [{ moodLevel: number; energyLevel: number; anxietyLevel: number }];
      expect(entry).toMatchObject({
        moodLevel: 3,
        energyLevel: 3,
        anxietyLevel: 2,
      });
    });
  });
});
