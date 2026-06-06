import { parseCoachResponse } from "@/lib/gemini";

describe("parseCoachResponse", () => {
  // ─── Plain text (ideal path) ───────────────────────────────────────────────

  it("returns plain text as-is after sanitization", () => {
    const input =
      "It sounds like you are feeling overwhelmed. That is completely normal before exams. Try breaking your revision into 25-minute focused blocks followed by a 5-minute walk.";
    const result = parseCoachResponse(input);
    expect(result).toBe(input);
  });

  it("returns plain text with newlines intact", () => {
    const input = "You are doing great.\n\nRemember to sleep well tonight.";
    const result = parseCoachResponse(input);
    expect(result).toContain("You are doing great.");
    expect(result).toContain("Remember to sleep well tonight.");
  });

  it("trims leading and trailing whitespace from plain text", () => {
    const result = parseCoachResponse("  Hello there!  ");
    expect(result).toBe("Hello there!");
  });

  // ─── Raw JSON — WellnessInsight shape ────────────────────────────────────

  it("extracts summary and suggestions from WellnessInsight JSON", () => {
    const json = JSON.stringify({
      summary: "You are managing exam pressure well.",
      suggestions: [
        "Take a 10-minute walk after every revision hour.",
        "Write down three things you know well before sleeping.",
      ],
      triggers: ["Mock test anxiety"],
      positives: ["Consistent journaling"],
    });
    const result = parseCoachResponse(json);
    expect(result).toContain("You are managing exam pressure well.");
    expect(result).toContain("Take a 10-minute walk");
    expect(result).toContain("Write down three things");
    expect(result).not.toContain("{");
    expect(result).not.toContain('"summary"');
  });

  it("formats suggestions as bullet points", () => {
    const json = JSON.stringify({
      summary: "Here is your support.",
      suggestions: ["Breathe deeply", "Stay hydrated"],
      triggers: [],
      positives: [],
    });
    const result = parseCoachResponse(json);
    expect(result).toContain("•");
    expect(result).toContain("Breathe deeply");
    expect(result).toContain("Stay hydrated");
  });

  it("handles JSON with only a message field", () => {
    const json = JSON.stringify({
      message: "Exam anxiety is real. You are not alone in feeling this way.",
    });
    const result = parseCoachResponse(json);
    expect(result).toContain("Exam anxiety is real");
    expect(result).not.toContain('"message"');
  });

  it("handles JSON with response field", () => {
    const json = JSON.stringify({
      response: "Take it one day at a time.",
    });
    const result = parseCoachResponse(json);
    expect(result).toBe("Take it one day at a time.");
  });

  it("handles JSON with content field", () => {
    const json = JSON.stringify({ content: "You are stronger than you think." });
    const result = parseCoachResponse(json);
    expect(result).toBe("You are stronger than you think.");
  });

  it("handles JSON with text field", () => {
    const json = JSON.stringify({ text: "Focus on what you can control." });
    const result = parseCoachResponse(json);
    expect(result).toBe("Focus on what you can control.");
  });

  // ─── Nested wellness_coach_response wrapper ───────────────────────────────

  it("extracts text from wellness_coach_response wrapper", () => {
    const json = JSON.stringify({
      wellness_coach_response: {
        summary: "Your stress levels are manageable.",
        suggestions: ["Practice deep breathing", "Review one topic at a time"],
        triggers: [],
        positives: [],
      },
    });
    const result = parseCoachResponse(json);
    expect(result).toContain("Your stress levels are manageable.");
    expect(result).toContain("Practice deep breathing");
    expect(result).not.toContain("wellness_coach_response");
    expect(result).not.toContain("{");
  });

  // ─── Markdown-wrapped JSON ────────────────────────────────────────────────

  it("strips ```json code fences and extracts content", () => {
    const input = `\`\`\`json
{
  "summary": "Study stress is completely normal.",
  "suggestions": ["Sleep 7-8 hours", "Eat a proper meal"],
  "triggers": [],
  "positives": []
}
\`\`\``;
    const result = parseCoachResponse(input);
    expect(result).toContain("Study stress is completely normal.");
    expect(result).toContain("Sleep 7-8 hours");
    expect(result).not.toContain("```");
    expect(result).not.toContain('"summary"');
  });

  it("strips plain ``` code fences", () => {
    const input = `\`\`\`
{"message": "You are doing well."}
\`\`\``;
    const result = parseCoachResponse(input);
    expect(result).toBe("You are doing well.");
    expect(result).not.toContain("```");
  });

  it("handles JSON embedded in prose (not fenced)", () => {
    const input = `Here is my response: {"message": "Keep going, you are close."}`;
    const result = parseCoachResponse(input);
    expect(result).toContain("Keep going");
    expect(result).not.toContain('"message"');
  });

  // ─── Malformed / edge cases ───────────────────────────────────────────────

  it("returns fallback for empty string", () => {
    const result = parseCoachResponse("");
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result).toBe("string");
  });

  it("returns fallback for whitespace-only string", () => {
    const result = parseCoachResponse("   \n  ");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns plain text for malformed JSON that is not extractable", () => {
    const input = "{ broken json :::";
    const result = parseCoachResponse(input);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("strips HTML tags from output", () => {
    const result = parseCoachResponse("<b>Stay strong</b> during your exams.");
    expect(result).not.toContain("<b>");
    expect(result).toContain("Stay strong");
  });

  it("does not return raw angle brackets", () => {
    const result = parseCoachResponse("Focus on <your> strengths.");
    expect(result).not.toContain("<your>");
  });

  it("caps output at 1200 characters", () => {
    const longText = "a".repeat(2000);
    const result = parseCoachResponse(longText);
    expect(result.length).toBeLessThanOrEqual(1200);
  });

  it("returns a non-JSON string when JSON has no recognized text field", () => {
    const json = JSON.stringify({ unknown_field: 42, another_field: true });
    const result = parseCoachResponse(json);
    expect(result).not.toContain("{");
    expect(result).not.toContain('"unknown_field"');
    expect(typeof result).toBe("string");
  });

  // ─── Does not leak JSON to UI ─────────────────────────────────────────────

  it("never returns a string that starts with {", () => {
    const inputs = [
      '{"summary": "test"}',
      '```json\n{"summary": "test"}\n```',
      '  {"wellness_coach_response": {"summary": "hello"}}  ',
    ];
    for (const input of inputs) {
      const result = parseCoachResponse(input);
      expect(result.trimStart()).not.toMatch(/^\{/);
    }
  });
});
