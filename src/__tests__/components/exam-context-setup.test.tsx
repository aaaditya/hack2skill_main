import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExamContextSetup } from "@/features/exam/components/exam-context-setup";
import type { ExamContext } from "@/types";

// ─── Mock next/navigation ──────────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// ─── Mock store ───────────────────────────────────────────────────────────────
const mockSetExamContext = jest.fn();
const mockClearExamContext = jest.fn();

function buildStoreMock(examContext: ExamContext | null = null) {
  return {
    state: {
      moodEntries: [],
      journalEntries: [],
      chatHistory: [],
      wellnessScore: null,
      examContext,
      isLoaded: true,
    },
    addMoodEntry: jest.fn(),
    addJournalEntry: jest.fn(),
    updateJournalInsight: jest.fn(),
    addChatMessage: jest.fn(),
    setExamContext: mockSetExamContext,
    clearExamContext: mockClearExamContext,
    clearChat: jest.fn(),
  };
}

jest.mock("@/features/wellness/hooks/use-wellness-store", () => ({
  useWellnessStore: jest.fn(),
}));

import { useWellnessStore } from "@/features/wellness/hooks/use-wellness-store";
const mockedStore = useWellnessStore as jest.MockedFunction<typeof useWellnessStore>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedStore.mockReturnValue(buildStoreMock());
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ExamContextSetup — full form (no existing context)", () => {
  it("renders exam type buttons for all 9 exam types", () => {
    render(<ExamContextSetup />);
    const examTypes = [
      "NEET", "JEE", "CUET", "CAT", "GATE", "UPSC",
      "Class 12 Boards", "Class 10 Boards", "Other",
    ];
    for (const exam of examTypes) {
      expect(screen.getByRole("button", { name: new RegExp(exam) })).toBeInTheDocument();
    }
  });

  it("renders phase options (Preparing and Awaiting Results)", () => {
    render(<ExamContextSetup />);
    expect(screen.getByRole("button", { name: /Preparing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Awaiting Results/i })).toBeInTheDocument();
  });

  it("shows days input when Preparing phase is selected", () => {
    render(<ExamContextSetup />);
    expect(screen.getByLabelText(/Days Until Exam/i)).toBeInTheDocument();
  });

  it("hides days input when Awaiting Results phase is selected", () => {
    render(<ExamContextSetup />);
    const awaitingButton = screen.getByRole("button", { name: /Awaiting Results/i });
    fireEvent.click(awaitingButton);
    expect(screen.queryByLabelText(/Days Until Exam/i)).not.toBeInTheDocument();
  });

  it("marks the selected exam type button as pressed", () => {
    render(<ExamContextSetup />);
    const neetButton = screen.getByRole("button", { name: /NEET/i });
    expect(neetButton).toHaveAttribute("aria-pressed", "true");
  });

  it("marks the selected phase button as pressed", () => {
    render(<ExamContextSetup />);
    const preparingButton = screen.getByRole("button", { name: /Preparing: Exam is coming up/i });
    expect(preparingButton).toHaveAttribute("aria-pressed", "true");
  });

  it("renders a submit button", () => {
    render(<ExamContextSetup />);
    expect(screen.getByRole("button", { name: /Set Exam/i })).toBeInTheDocument();
  });
});

describe("ExamContextSetup — compact mode with existing context", () => {
  const examContext: ExamContext = {
    examType: "NEET",
    daysUntilExam: 45,
    phase: "preparing",
  };

  beforeEach(() => {
    mockedStore.mockReturnValue(buildStoreMock(examContext));
  });

  it("renders compact banner with exam name", () => {
    render(<ExamContextSetup compact />);
    expect(screen.getByText("NEET")).toBeInTheDocument();
  });

  it("shows Preparing in compact banner for preparing phase", () => {
    render(<ExamContextSetup compact />);
    expect(screen.getByText(/Preparing/i)).toBeInTheDocument();
  });

  it("renders Change button in compact mode", () => {
    render(<ExamContextSetup compact />);
    expect(screen.getByRole("button", { name: /Change exam/i })).toBeInTheDocument();
  });

  it("calls clearExamContext when Change button is clicked", () => {
    render(<ExamContextSetup compact />);
    fireEvent.click(screen.getByRole("button", { name: /Change exam/i }));
    expect(mockClearExamContext).toHaveBeenCalledTimes(1);
  });

  it("shows Awaiting Results label for awaiting phase", () => {
    mockedStore.mockReturnValue(
      buildStoreMock({ examType: "JEE", daysUntilExam: 0, phase: "awaiting_results" })
    );
    render(<ExamContextSetup compact />);
    expect(screen.getByText(/Awaiting results/i)).toBeInTheDocument();
  });
});
